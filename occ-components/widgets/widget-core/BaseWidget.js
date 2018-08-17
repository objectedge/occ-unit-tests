import ko from 'knockout';
import ccLogger from 'ccLogger';
import viewportHelper from 'viewportHelper';

export class BaseWidget {
  constructor() {
    this.applyContexts(this);
    this._setExtensionSettings();
    this._setViewportHelper();
  }

  _setExtensionSettings() {
    this.$data.siteSettings = ko.observable();
    
    let extensionSiteSettings = this.$data.site().extensionSiteSettings;
    this.$data.siteSettings(Object.keys(extensionSiteSettings).length ? extensionSiteSettings : null);
  }

  _setViewportHelper() {
    this.$data.viewportHelper = viewportHelper;
    this.$data.viewportClass = ko.pureComputed(function () {
      return 'viewport-' + viewportHelper.viewportDesignation();
    });

    this.$data.isPhone = ko.observable(false);
    this.$data.isTablet = ko.observable(false);
    this.$data.isLaptop = ko.observable(false);
    this.$data.isDesktop = ko.observable(false);

    this._setCurrentViewport(viewportHelper.viewportDesignation());

    viewportHelper.viewportDesignation.subscribe(viewport => this._setCurrentViewport(viewport));
  }

  _setCurrentViewport(currentViewport) {
    let viewportMapping = {};

    viewportMapping.xs = this.$data.isPhone;
    viewportMapping.sm = this.$data.isTablet;
    viewportMapping.md = this.$data.isLaptop;
    viewportMapping.lg = this.$data.isDesktop;

    Object.keys(viewportMapping).forEach((viewportKey) => viewportMapping[viewportKey](viewportKey === currentViewport));
  }

  getSiteSetting(key) {
    if(!this.hasSiteSettings()) {
      this.log('There is no Site Settings configured', 'warn');
      return false;
    }

    let siteSettings = this.$data.siteSettings();

    if(typeof siteSettings[key] === 'undefined') {
      this.log(`The setting ${key} doesn't exist`, 'warn');
      return false;
    }

    return siteSettings[key];
  }

  hasSiteSettings() {
    return this.$data.siteSettings() !== null;
  }

  log(message, type = 'info', context) {
    context = context || this.$data.displayName();    
    ccLogger[type](`[OE][${context}] - ${message}`);
  }
};
