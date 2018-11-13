# Hubspot Ship

## WHAT PROBLEM ARE WE SOLVING AND WHY

Our customers want to free themselves from the limitations of Hubspot Marketing’s Contact Management . It’s too limited and only knows about what happens inside of Hubspot.

#### They want

* In Hubspot: Cleaner, Better formatted data, and select customer properties coming from Hull
* Better Data in their other tools (Analytics, Personalization etc…) by getting Properties and Events from Hubspot in Hull for further segmentation.

## JOB STORIES

* Get more precise information about each customer in Hubspot
* Build more precise segments in Hull with Hubspot data
* Compute Customer Scores from data in Hubspot and Hull, store in Hubspot.
* Simplify email personalization in Hubspot by computing segments and customer properties in Hull and sending the results in Hubspot
* Target Facebook Advertising (Custom Audiences) with customer data from Hubspot. 

## HOW WILL WE MEASURE SUCCESS

We are looking for a product that makes it easy to collect data from Hubspot, and send it back there, letting the customer define the exact mapping.

## SCOPE

The Hubspot Ship already has an existing version available that only handles oAuth and basic communication to/from Hubspot. We forked the libs to support additional properties and fix a few bugs. The scope is about building the fetch and sync strategy, define Mapping in the simplest way possible, handling it automatically as much as possible, polish and test so it can be installed and used by a non-technical customer with a simple and intuitive workflow.

## NOTES

General philosophy is that it should “just work” with the minimal amount of work possible, and have it’s setup optionally improved by specifying options and parameters.  A bad example would be that It says it is installed correctly but doesn’t sync anything by default

### TECH STACK

- Our own fork of https://github.com/brainflake/node-hubspot → https://github.com/segmentio/node-hubspot →
https://github.com/unity/node-hubspot
Some bug fixes and also handling of more methods (Company Property Groups)

- https://github.com/brainflake/passport-hubspot →
https://github.com/unity/passport-hubspot

Might need to merge newer changes in each of those.

# USER STORIES
__TO BE WRITTEN__

---

# WHAT CAN BE DONE NOW

### A button to "Fetch all" customers from Hubspot
Will fetch all customers from Hubspot, using Batching if needed, and store their properties in Hull customers, upserting those that already exist (found by email)

### A regularly scheduled sync (as frequent as possible)
To fetch all new and updated customers in Hubspot and store them as Hull users and update those already in there.

---

# Later (Strategy to be determined)


- [x] ~~ Hubspot (default properties) -> Hull~~
- [ ] Hubspot (custom properties) -> Hull
- [ ] Hull -> Hubspot (default properties)
- [ ] Hull -> Hubspot (custom properties) (edited)
- [ ] Hubspot -> Hull (events)
- [ ] Hull -> Hubspot (selected events)



- Saving the `hull_segments` property to Hubspot to display Hull segments that the customer belongs to in Hubspot
- Support for Sending default Hull properties as Hubspot properties
- Support for updating default Hubspot properties in the Hubspot group in hull and synching back to hubspot
- Support for sending custom Hull properties as Hubspot properties 
- Publishing Select Hull events as Hubspot activities ?
- Storing Hubspot Events as Hull Events
