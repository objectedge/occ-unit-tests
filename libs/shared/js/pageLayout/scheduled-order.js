/**
 * @fileoverview ScheduledOrderViewModel class.
 */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/scheduled-order',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['ccConstants', 'knockout', 'ccDate', 'pageLayout/rest-adapter', 'pubsub', 'ccStoreConfiguration'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (CCConstants, ko, ccDate, restAdapter, pubsub, CCStoreConfiguration) {

  "use strict";

  // The order of this array is algorithmically SIGNIFICANT!
  var scheduleModes = [
    CCConstants.SCHEDULE_MODE_QUARTERLY,
    CCConstants.SCHEDULE_MODE_BI_MONTHLY,
    CCConstants.SCHEDULE_MODE_ONCE_MONTHLY,
    CCConstants.SCHEDULE_MODE_TWICE_DAILY,
    CCConstants.SCHEDULE_MODE_ONCE_DAILY,
    CCConstants.SCHEDULE_MODE_WEEKLY
  ];

  // REGEX patterns used to determine the current schedule mode.
  var scheduleModePatterns = {};

  scheduleModePatterns[CCConstants.SCHEDULE_MODE_QUARTERLY] = {
    occurrenceInDay: /^1$/,
    daysOfWeek: /^$/,
    daysInMonth: /^1$/,
    weeksInMonth: /^$/,
    monthsInYear: /^([0-9]|1[0-1])(,([0-9]|(1[0-1]))){3,3}$/
  };

  scheduleModePatterns[CCConstants.SCHEDULE_MODE_BI_MONTHLY] = {
    occurrenceInDay:  /^1$/,
    daysOfWeek: /^$/,
    daysInMonth: /^1$/,
    weeksInMonth: /^$/,
    monthsInYear: /^([0-9]|1[0-1])(,([0-9]|(1[0-1]))){5,5}$/
  };

  scheduleModePatterns[CCConstants.SCHEDULE_MODE_ONCE_MONTHLY] = {
    occurrenceInDay: /^1$/,
    daysOfWeek: /^$/,
    daysInMonth: /^1$/,
    weeksInMonth: /^$/,
    monthsInYear: /^0,1,2,3,4,5,6,7,8,9,10,11$/
  };

  scheduleModePatterns[CCConstants.SCHEDULE_MODE_TWICE_DAILY] = {
    occurrenceInDay: /^2$/,
    daysOfWeek: /^.*$/,
    daysInMonth:  /^$/,
    weeksInMonth: /^1,2,3,4,5$/,
    monthsInYear: /^0,1,2,3,4,5,6,7,8,9,10,11$/
  };

  scheduleModePatterns[CCConstants.SCHEDULE_MODE_ONCE_DAILY] = {
    occurrenceInDay: /^1$/,
    daysOfWeek: /^1,2,3,4,5,6,7$/,
    daysInMonth:  /^$/,
    weeksInMonth: /^1,2,3,4,5$/,
    monthsInYear: /^0,1,2,3,4,5,6,7,8,9,10,11$/
  };

  scheduleModePatterns[CCConstants.SCHEDULE_MODE_WEEKLY] = {
    occurrenceInDay: /^1$/,
    daysOfWeek: /^([1-7])(,[1-7]){0,6}$/,
    daysInMonth: /^$/,
    weeksInMonth: /^([1-5])(,[1-5]){0,4}$/,
    monthsInYear: /^0,1,2,3,4,5,6,7,8,9,10,11$/
  };

  // Seed states used to initialize a schedule mode preset.
  var scheduleSeeds = {};

  scheduleSeeds[CCConstants.SCHEDULE_MODE_QUARTERLY] = {
    occurrenceInDay: 1,
    daysOfWeek: [],
    daysInMonth: [1],
    weeksInMonth: [],
    monthsInYear: [0, 3, 6, 9]
  };

  scheduleSeeds[CCConstants.SCHEDULE_MODE_BI_MONTHLY] = { 
    occurrenceInDay: 1,
    daysOfWeek: [],
    daysInMonth: [1],
    weeksInMonth: [],
    monthsInYear: [0, 2, 4, 6, 8, 10]
  };

  scheduleSeeds[CCConstants.SCHEDULE_MODE_ONCE_MONTHLY] = { 
    occurrenceInDay: 1,
    daysOfWeek: [],
    daysInMonth: [1],
    weeksInMonth: [],
    monthsInYear: [0 ,1 ,2 ,3 ,4 ,5 ,6 ,7 ,8 ,9 ,10 ,11]
  };

  scheduleSeeds[CCConstants.SCHEDULE_MODE_TWICE_DAILY] = { 
    occurrenceInDay: 2,
    daysOfWeek: [],
    daysInMonth: [],
    weeksInMonth: [1, 2, 3, 4, 5],
    monthsInYear: [0 ,1 ,2 ,3 ,4 ,5 ,6 ,7 ,8 ,9 ,10 ,11]
  };

  scheduleSeeds[CCConstants.SCHEDULE_MODE_ONCE_DAILY] = { 
    occurrenceInDay: 1,
    daysOfWeek: [1,2,3,4,5,6,7],
    daysInMonth: [],
    weeksInMonth: [1, 2, 3, 4, 5],
    monthsInYear: [0 ,1 ,2 ,3 ,4 ,5 ,6 ,7 ,8 ,9 ,10 ,11]
  };

  scheduleSeeds[CCConstants.SCHEDULE_MODE_WEEKLY] = { 
    occurrenceInDay: 1,
    daysOfWeek: [1],
    daysInMonth: [],
    weeksInMonth: [1,2,3,4,5],
    monthsInYear: [0 ,1 ,2 ,3 ,4 ,5 ,6 ,7 ,8 ,9 ,10 ,11]
  };

  scheduleSeeds[CCConstants.SCHEDULE_MODE_CUSTOM] = { 
    occurrenceInDay: 1,
    daysOfWeek: [],
    daysInMonth: [],
    weeksInMonth: [],
    monthsInYear: []
  };

  // Compare function used for sorting integer arrays.
  // ~ Should this be in a utilities module?
  function compareNumbers (a, b) {
    return a - b;
  }

  // Create a dirty flag for an observable model
  // ~ Should this be in a utilities module?
  function createDirtyFlag (model) {
    var initialized = ko.observable(false);
     
    return {
      isDirty: ko.computed(function () {
        if (!initialized()) {
          // Subscribe to model changes.
          ko.toJS(model)

          // Mark as initialized to prevent re evaluating the dirty flag when already dirty.
          initialized(true);

          // Is clean.
          return false;
        }
        // Is dirty.
        return true
      }),

      // Reset the dirty flag to initial clean state.
      reset: function () {
        initialized(false);
      }
    };
  }

  /**
   * Class for a Scheduled Order view model.
   * 
   * @class
   * @param {RestAdapter} adapter - The datasource adapter instance.
   * @param {Object} data - The initial state of the Scheduled Order.
   * @property {ko.observable<String>} id - The Scheduled Order id.
   * @property {ko.observable<String>} name - The Scheduled Order name.
   * @property {ko.observable<String>} state - The Scheduled Order state, e.g. [Active].
   * @property {ko.observable<String>} scheduleType - The Scheduled Order schedule type, e.g. [Calendar].
   * @property {ko.observable<Integer>} occurrenceInDay - How many times the per day the schedule should run. Valid 
   *    values are [1|2]. ** Calendar Schedule only.
   * @property {ko.observableArray<Integer>} daysOfWeek - On which days in the week the scheulde will run. Valid 
   *    values are [1-7]. ** Calendar Schedule only.
   * @property {ko.observableArray<Integer>} daysInMonth - Which dates in the month a schedule will run. Valid
   *    values are [1-31]. ** Calendar Schedule only.
   * @property {ko.observableArray<Integer>} weeksInMonth - Which occurrences of weeks in the month a schedule will 
   *    run. Valid values are [1-5]. ** Calendar Schedule only.
   * @property {ko.observableArray<Integer>} monthsInYear - Which month of weeks in the month a schedule will run.
   *    Valid values are [0-11]. ** Calendar Schedule only.
   * @property {ko.observable<String>} startDate - When the schedule is eligible to be run. ** Date string ISO 8601
   *    Extended Format
   * @property {ko.observable<String>} endDate - When the schedule expires. ** Date string ISO 8601
   *    Extended Format
   * @property {ko.observable<String>} nextScheduledRun - When the schedule will run next. ** Date string ISO 8601
   *    Extended Format
   * @property {ko.observable<String>} profileId - The profile assoicated to the Scheduled Order.
   * @property {ko.observable<String>} templateOrderId - The template order associated to the Scheduled Order.
   * @property {ko.observable<Object>} templateOrder - The template order details [Optional].
   * @property {ko.observableArray<Object>} clonedOrders - The list of cloned orders on the Scheduled Order.
   * @property {ko.observable<Object>} lastError - The last error to occur when running the scheduler on this 
   *    Scheduled Order.
   * @property {ko.observable<String>} scheduleMode - The Scheduled Order schedule mode. ** This is a subscribed field.
   * @property {CCStoreConfiguration} storeConfiguration An instance of the cc-store-configuration containing store-configuration data.
   */
  function ScheduledOrderViewModel () {
    // Public properties.
    this.id = ko.observable();
    this.organizationId = ko.observable();
    this.name = ko.observable();
    this.state = ko.observable();
    this.scheduleType = ko.observable();
    this.occurrenceInDay = ko.observable();
    this.daysOfWeek = ko.observableArray();
    this.daysInMonth = ko.observableArray();
    this.weeksInMonth = ko.observableArray();
    this.monthsInYear = ko.observableArray();
    this.startDate = ko.observable();
    this.endDate = ko.observable();
    this.nextScheduledRun = ko.observable();
    this.profileId = ko.observable();
    this.templateOrderId = ko.observable();
    this.templateOrder = ko.observable();
    this.clonedOrders = ko.observableArray();
    this.lastError = ko.observable();
    this.suspend = ko.observable(false);
    this.scheduleMode = ko.observable();
    this.executionStatusList = ko.observableArray();
    // Private properties.
    this._adapter = new restAdapter('/ccstore/v1/');
    this._scheduleModes = scheduleModes;
    this._scheduleModePatterns = scheduleModePatterns;
    this._scheduleSeeds = scheduleSeeds;

    this.dirtyFlag = createDirtyFlag(this);
    this.subscriptions = [];
    this.storeConfiguration = CCStoreConfiguration.getInstance();

    //Periodic schedule properties
    this.period = ko.observable();
    this.delay = ko.observable();
    this.catchUp = ko.observable();

  }

  /**
   * Make a record of all model subscriptions to an array.
   *
   * @function
   */
  ScheduledOrderViewModel.prototype.subscribeForChanges = function subscribeForChanges () {
    this.subscriptions.push(this.scheduleMode.subscribe(this._setScheduleMode.bind(this),this));
  };

  /**
   * Dispose off all model subscriptions.
   *
   * @function
   */
  ScheduledOrderViewModel.prototype.dispose = function dispose () {
    var length = this.subscriptions.length;
    for(var i=0; i < length; i++) {
      this.subscriptions[i].dispose();
    }
  };

  /**
   * Persist the current state of the Scheduled Order view model to the repository. If the Scheduled Order doesn't 
   * already exist in the respository (i.e doesn't have an id), call the create Scheduled Order service; otherwise,
   * call the update Scheduled Order service.
   * 
   * @function
   * @param {function} success - Function called on a successful save.
   * @param {function} error - Function called on a failed save.
   */
  ScheduledOrderViewModel.prototype.save = function save (success,  error) {
    var data = this.toJS();

    var saveSuccess = function (result) {
      // Map result data.
      this.fromJS(result);

      if (typeof success === 'function') {
        // Invoke callback param.
        success(result);
      }

    }.bind(this);

    var saveError = function (result) {
      if (typeof error === 'function') {
        // Invoke callback param.
        error(result);
      }
    }.bind(this);

    if (data.id) {
      // Update the existing Scheduled Order respository state.
      this._adapter.persistUpdate('scheduledOrder', data.id, data, null, saveSuccess, saveError);
    }
    else {
      // Create a new Scheduled Order in the repository.
      this._adapter.persistCreate('scheduledOrder', null, data, null, saveSuccess, saveError);
    }
  };

  /**
   * Persist the removal of the Scheduled Order to the repository.
   *
   * @function
   * @param {function} success - Function called on a successful remove.
   * @param {function} error - Function called on a failed remove.
   */
  ScheduledOrderViewModel.prototype.remove = function remove (success,  error) {
    var id = this.id();

    var deleteSuccess = function (result) {
      if (typeof success === 'function') {
        // Invoke callback param.
        success(result);
      }
    }.bind(this);

    var deleteError = function (result) {
      if (typeof error === 'function') {
        // Invoke callback param.
        error(result);
      }
    }.bind(this);

    // Remove the existing Scheduled Order from respository.
    this._adapter.persistRemove('scheduledOrder', id, null, deleteSuccess, deleteError);
  };

  /**
   * Copy the values from a CC REST Scheduled Order data object into the Scheduled Order view model.
   * 
   * @function
   * @param {Object} data - A CC REST compatable Scheduled Order data object.
   */
  ScheduledOrderViewModel.prototype.fromJS = function fromJS (data) {
    // Default params.
    data = data || {};
    data.schedule = data.schedule || {};

    this.id(data.id);
    this.organizationId(data.templateOrder.organizationId);
    this.name(data.name);
    this.state(data.state);
    this.scheduleType(data.schedule.scheduleType || 'calendar');
    if (data.schedule.scheduleType && data.schedule.scheduleType == 'calendar') {
      this.occurrenceInDay(data.schedule.occurrenceInDay || 1);
      this.daysOfWeek(data.schedule.daysOfWeek || []);
      this.daysInMonth(data.schedule.daysInMonth || []);
      this.weeksInMonth(data.schedule.weeksInMonth || []);
      this.monthsInYear(data.schedule.monthsInYear || []);
    } else if (data.schedule.scheduleType && data.schedule.scheduleType == 'periodic') {
      this.period(data.schedule.period);
      this.catchUp(data.schedule.catchUp);
    }

    this.startDate(data.startDate);
    this.endDate(data.endDate || '');
    this.nextScheduledRun(data.nextScheduledRun);
    this.profileId(data.profileId);
    this.templateOrderId(data.templateOrderId);
    this.templateOrder(data.templateOrder || {});
    this.clonedOrders(data.clonedOrders || []);
    this.lastError(data.lastError);
    this.executionStatusList(data.executionStatusList || []);
    this.scheduleMode(this._getScheduleMode());
    this.dirtyFlag.reset();
    this.subscribeForChanges();
  };

  /**
   * Map the Scheduled Order view model to a CC REST Scheduled Order data object.
   * 
   * @function
   * @returns {Object} - The Scheduled Order state in a CC REST compatable format.
   */
  ScheduledOrderViewModel.prototype.toJS = function toJS () {
    var data = {
      id: this.id(),
      name: this.name(),
      state: this.state(),
      scheduleType: this.scheduleType(),
      schedule: (this.scheduleType() == 'periodic') ? {period: this.period(), catchUp: this.catchUp(), delay: this.delay()} : {
        occurrenceInDay: this.occurrenceInDay(),
        daysOfWeek: this.daysOfWeek(),
        daysInMonth: (this.daysInMonth().length != 0) ? this.daysInMonth() : undefined,
        weeksInMonth: this.weeksInMonth(),
        monthsInYear: this.monthsInYear()
      },
      startDate: getFormattedDate.call(this, this.startDate()),
      endDate: this.endDate() ? getFormattedDate.call(this, this.endDate()) : '',
      nextScheduledRun: this.nextScheduledRun(),
      profileId: this.profileId(),
      templateOrderId: this.templateOrderId(),
      //This is currently not required
      //templateOrder: this.templateOrder(),
      clonedOrders: this.clonedOrders(),
      lastError: this.lastError()
    };

    return data;
  };

  /**
   * Formats date to 'YYYY-MM-DD' as supported by endpoint
   *
   * @param date
   * @returns {string}
   */
  function getFormattedDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  /**
   * Determine the schedule mode from the current schedule state. 
   *
   * @function
   * @private
   * @returns {String} - The current schedule mode.
   */
  ScheduledOrderViewModel.prototype._getScheduleMode = function _getScheduleMode () {
    var scheduleMode = CCConstants.SCHEDULE_MODE_CUSTOM;

    for (var index in this._scheduleModes) {
      var mode = this._scheduleModes[index];

      if (this._testScheduleMode(mode)) {
        scheduleMode = mode;
        break;
      }
    }

    return scheduleMode;
  };

  /**
   * Test if the current schedule state matches this scheduleMode.
   *
   * @function
   * @private
   * @param {string} scheduleMode - The schedule mode under test.
   * @returns {boolean} - true if the current schedule state matches this scheduleMode; false if not.
   */
  ScheduledOrderViewModel.prototype._testScheduleMode = function _testScheduleMode (scheduleMode) {
    var matchFound =
      this._scheduleModePatterns[scheduleMode].occurrenceInDay.test(this.occurrenceInDay()) &&
      this._scheduleModePatterns[scheduleMode].daysOfWeek.test(this.daysOfWeek.sort(compareNumbers)()) &&
      this._scheduleModePatterns[scheduleMode].daysInMonth.test(this.daysInMonth.sort(compareNumbers)()) &&
      this._scheduleModePatterns[scheduleMode].weeksInMonth.test(this.weeksInMonth.sort(compareNumbers)()) &&
      this._scheduleModePatterns[scheduleMode].monthsInYear.test(this.monthsInYear.sort(compareNumbers)());

    return matchFound;
  };

  /**
   * Set the schedule state to the scheduleMode preset.
   *
   * @function
   * @private
   * @param {String} scheduleMode - The new schedule mode.
   */
  ScheduledOrderViewModel.prototype._setScheduleMode = function _setScheduleMode (scheduleMode) {
    // Use the param value to determine the correct schedule mode seed, use a sensible default if no corresponsing
    // seed is found.
    var scheduleSeed = this._scheduleSeeds[scheduleMode] || this._scheduleSeeds[CCConstants.SCHEDULE_MODE_CUSTOM];

    // Array.slice(0) clones a new instance of the array to ensure the seed array is never mutated.
    this.occurrenceInDay(scheduleSeed.occurrenceInDay);
    this.daysOfWeek(scheduleSeed.daysOfWeek.slice(0));
    this.daysInMonth(scheduleSeed.daysInMonth.slice(0));
    this.weeksInMonth(scheduleSeed.weeksInMonth.slice(0));

    if (scheduleMode === CCConstants.SCHEDULE_MODE_BI_MONTHLY) {
      var date = new Date(this.startDate());
      var months = [];
      var j = 0;
      var currentMonth = date.getMonth();
      while (true) {
        months[j] = currentMonth;
        currentMonth = (currentMonth + 2) % 12;
        if (currentMonth == date.getMonth()) {
          break;
        }
        j++;
      }
      this.monthsInYear(months.sort(compareNumbers));
    }
    else {
      this.monthsInYear(scheduleSeed.monthsInYear.slice(0));
    }
  };

  /**
   * Clears the data and errors associated with this object.
   * @function
   * @private
   */
  ScheduledOrderViewModel.prototype.reset = function reset () {
    var self = this;
    self.id('');
    self.name('');
    self.state('');
    self.scheduleType('');
    self.occurrenceInDay('');
    self.daysOfWeek([]);
    self.daysInMonth([]);
    self.weeksInMonth([]);
    self.monthsInYear([]);
    self.startDate('');
    self.endDate('');
    self.nextScheduledRun('');
    self.profileId('');
    self.executionStatusList([]);
    self.templateOrderId('');
    self.templateOrder('');
    self.clonedOrders([]);
    self.lastError('');
    self.suspend('');
    self.dispose();
    self.scheduleMode('');
    self.dirtyFlag.reset();
    self.period('');
    self.delay('');
    self.catchUp('');
  };


  /**
   * Loads the data by a rest call to schedule order endpoint.
   * @function
   * @private
   * @param {string} pScheduledOrderId - The schedule order id.
   * @returns {object} - The current scheduled order view model instance.
   */
  ScheduledOrderViewModel.prototype.load = function load (pScheduledOrderId) {
    var self = this;
    var inputData = {};
    inputData['orderDetails'] = true;
    var contextObj = {};
    contextObj[CCConstants.ENDPOINT_KEY] = CCConstants.ENDPOINT_GET_SCHEDULED_ORDER;
    contextObj[CCConstants.IDENTIFIER_KEY] = "loadOrder";
    var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
    if (filterKey) {
      inputData[CCConstants.FILTER_KEY] = filterKey;
    }
    self._adapter.loadJSON('scheduledOrder',
        pScheduledOrderId, inputData,
        // success callback
        function(data) {
          self.fromJS(data);
          var errors = {
            message: data.errorMessages ? data.errorMessages : undefined
          };
          $.Topic(pubsub.topicNames.SCHEDULED_ORDER_LOAD_SCUCCESS).publishWith(errors);
        },
        // error callback
        function(data) {
          $.Topic(pubsub.topicNames.SCHEDULED_ORDER_LOAD_ERROR).publishWith(data);
        });
    return this;
  };

  /**
   * ScheduledOrderViewModel singleton factory.
   *
   * @function
   * @static
   * @returns {ScheduledOrderViewModel} - ScheduledOrderViewModel singleton.
   */
  ScheduledOrderViewModel.getInstance = function getInstance () {
    if(!ScheduledOrderViewModel.singleInstance) {
      ScheduledOrderViewModel.singleInstance = new ScheduledOrderViewModel();
    }

    return ScheduledOrderViewModel.singleInstance;
  };

  return ScheduledOrderViewModel;
});

