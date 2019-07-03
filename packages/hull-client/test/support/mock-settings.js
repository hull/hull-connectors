function mockSettings(settings) {
  return {
    hull: {
      ship: {
        private_settings: settings
      }
    }
  };
}

module.exports = mockSettings;
