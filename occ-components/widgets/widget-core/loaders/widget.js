export class Widget {
  resourcesLoaded($data) {
    $.Topic('widget.' + $data.id() + '.resourcesLoaded').publish();
  }

  beforeAppear(pageContext, $data) {
    $.Topic('widget.' + $data.id() + '.beforeAppear').publish(pageContext);
  }

  load($currentWidgetData, widgetContext, viewModels) {
    let instance = this;

    /**
     * This will fix the $data context, keeping synced the 
     * properties from the viewModel and the $data from
     * the widget
     */
    let applyDataProperties = (dataProperties, viewModel, context) => {
      if(dataProperties) {
        Object.keys(dataProperties).forEach(function (propertyKey) {
          if(propertyKey !== '__dataApplied') {
            context.$data[propertyKey] = context[propertyKey];
          }
        });
        viewModel.prototype.$dataProperties.__widgetInstanceId = context.$data.id();
      }
    };

    /**
     * This will fix the context of the each method of
     * each view model
     */
    let applyDataMethods = (dataMethods, context) => {
      if(dataMethods) {
        Object.keys(dataMethods).forEach(function (methodKey) {
          context.$data[methodKey] = function () { 
            let args = Array.prototype.slice.call(arguments);

            //Original this
            args.push(this);
            return dataMethods[methodKey].apply(context, args);
          }
        });
      }
    };

    const viewModelsInstances = {};

    Object.keys(viewModels).forEach(viewModelName => {
      let viewModel = viewModels[viewModelName];
      let dataMethods = viewModel.prototype.$dataMethods;
      let dataProperties = viewModel.prototype.$dataProperties;

      /**
       * Ensure the correct context of the view model
       */
      viewModel.prototype.applyContexts = function (context) {
        context.$data = $currentWidgetData;
        context.viewModels = viewModelsInstances;

        applyDataProperties(dataProperties, viewModel, context);

        /**
         * Apply the method of the current view model
         */
        applyDataMethods(dataMethods, context);

        /**
         * Set the listener to the beforeAppear
         */
        $.Topic('widget.' + $currentWidgetData.id() + '.beforeAppear').subscribe(pageContext => {
          if(typeof context.beforeAppear === 'function') {
            context.beforeAppear(pageContext);
          }
        });

         /**
         * Set the listener to the resourcesLoaded
         */
        $.Topic('widget.' + $currentWidgetData.id() + '.resourcesLoaded').subscribe(() => {
          if(typeof context.resourcesLoaded === 'function') {
            context.resourcesLoaded();
          }
        });
      };

      /**
       * Instantiate the current view model
       * @type {viewModel}
       */
      const viewModelInstance = new viewModel();
      viewModelsInstances[viewModelName] = viewModelInstance;
    });
  }
};
