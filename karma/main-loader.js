define('mainLoader', ['pageLayout/user', 'occ-for-tests-laoder', 'widgetCore'], (User, occLoader, widgetCore) => {
  let layoutContainer;

  function MainLoader(context) {
    context.mainLoader = this;
    return new Promise(resolve => {
      if(layoutContainer) {
        return resolve(layoutContainer);
      }

      occLoader.load().then(layoutContainerInstance => {
        // Give it some time to load the settings
        setTimeout(function () {
          layoutContainer = layoutContainerInstance;
          resolve(layoutContainer);
        }, 300);
      });
    });
  }

  MainLoader.prototype.setData = function (mockData) {
    return new Promise(resolve => {
      $.ajax({
        url: `/mock?path=${mockData.user}`
      }).done(responseUserData => {
        User.singleInstance = null;
        const userData = new User(layoutContainer, responseUserData);
        $.ajax({
          url: `/mock?path=${mockData.widget}`
        }).done(responseWidgetData => {
          const widgetData = layoutContainer.viewModelBuilder.widget.load(responseWidgetData, layoutContainer, { load: false });
          layoutContainer.runWidgetInitialization(widgetData, true);
          widgetData.setCurrent('user', userData);
          resolve(widgetData);
        });
      });
    });
  };

  MainLoader.prototype.loadViewModels = function (widgetData, classes) {
    return new Promise(resolve => {
      const loader = new widgetCore.loaders.Widget();
      const viewModels = loader.load(widgetData, widgetData, classes);
      resolve(viewModels);
    });
  };

  MainLoader.prototype.getViewModelWithData = function (options) {
    return new Promise(resolve => {
      this.setData(options.data)
          .then(widgetData => {
            const viewModelToBeLoaded = {
              [options.viewModelName]: options.classes[options.viewModelName]
            };

            this.loadViewModels(widgetData, viewModelToBeLoaded).then(viewModels => {
              options.context[options.viewModelName] = viewModels[options.viewModelName];
              resolve();
            });
          });
    });
  };

  MainLoader.prototype.clear = function () {
    layoutContainer.contextHandler.flush(true);
  };

  return MainLoader;
});
