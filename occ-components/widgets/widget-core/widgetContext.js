import { Widget as WidgetLoader } from './loaders';

export function init(allViewModels) {
  const widgetLoader = new WidgetLoader();

  return {
    onLoad($data) {
      widgetLoader.load($data, this, allViewModels);
    },

    beforeAppear(pageContext) {
      widgetLoader.beforeAppear(pageContext, this);
    },

    resourcesLoaded($data) {
      widgetLoader.resourcesLoaded($data);
    }
  };
};
