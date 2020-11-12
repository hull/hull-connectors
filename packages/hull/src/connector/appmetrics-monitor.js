import StatsdClient from "statsd-client";
import AppMetrics from "appmetrics";

const MonitorStatus = { client: null };

function start(connector, { host, port }) {
  const monitor = AppMetrics.monitor();

  if (MonitorStatus.client) return MonitorStatus.client;

  const client = new StatsdClient({
    host,
    port,
    prefix: "connectors.appmetrics",
    tags: {
      connector_version: connector.manifest.version,
      connector_name: connector.manifest.name,
      hull_env: process.env.HULL_ENV || "production",
      MESOS_TASK_ID: process.env.MESOS_TASK_ID,
      MARATHON_APP_ID: process.env.MARATHON_APP_ID
    }
  });

  setInterval(() => {
    const handles = process._getActiveHandles().length;
    const requests = process._getActiveRequests().length;
    console.log("process.active_handles", handles);
    console.log("process.active_requests", requests);
    client.gauge("process.active_handles", handles);
    client.gauge("process.active_requests", requests);
  }, 10000);

  monitor.on("cpu", function handleCPU(cpu) {
    client.gauge("cpu.process", cpu.process);
    client.gauge("cpu.system", cpu.system);
  });

  monitor.on("memory", function handleMem(memory) {
    client.gauge("memory.process.private", memory.private);
    client.gauge("memory.process.physical", memory.physical);
    client.gauge("memory.process.virtual", memory.virtual);
    client.gauge("memory.system.used", memory.physical_used);
    client.gauge("memory.system.total", memory.physical_total);
  });

  monitor.on("eventloop", function handleEL(eventloop) {
    client.gauge("eventloop.latency.min", eventloop.latency.min);
    client.gauge("eventloop.latency.max", eventloop.latency.max);
    client.gauge("eventloop.latency.avg", eventloop.latency.avg);
  });

  monitor.on("gc", function handleGC(gc) {
    client.gauge("gc.size", gc.size);
    client.gauge("gc.used", gc.used);
    client.timing("gc.duration", gc.duration);
  });

  monitor.on("http", function handleHTTP(http) {
    client.timing("http", http.duration);
  });

  monitor.on("http-outbound", function handleHTTP(http) {
    client.timing("http", http.duration);
  });

  monitor.on("https", function handleHTTP(https) {
    client.timing("https", https.duration);
  });

  monitor.on("https-outbound", function handleHTTP(https) {
    client.timing("https", https.duration);
  });

  monitor.on("socketio", function handleSocketio(socketio) {
    client.timing(
      `socketio.${socketio.method}.${socketio.event}`,
      socketio.duration
    );
  });

  monitor.on("mysql", function handleMySQL(mysql) {
    client.timing("mysql", mysql.duration);
  });

  monitor.on("postgresql", function handleMySQL(postgresql) {
    client.timing("postgresql", postgresql.duration);
  });

  monitor.on("mongo", function handleMongo(mongo) {
    client.timing("mongo", mongo.duration);
  });

  monitor.on("redis", function handleRedis(redis) {
    client.timing(`redis.${redis.cmd}`, redis.duration);
  });

  monitor.on("memcached", function handleMemcached(memcached) {
    client.timing(`memcached.${memcached.method}`, memcached.duration);
  });

  MonitorStatus.client = client;

  return client;
}

module.exports = { start };
