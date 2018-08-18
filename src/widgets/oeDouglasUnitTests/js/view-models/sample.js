/**
 * Core
 */
import { exportToViewModel } from 'occ-components/widget-core/decorators';
import { BaseWidget } from 'occ-components/widget-core';

/**
 * Libraries, Helpers
 */
import ko from 'knockout';

/**
 * Models
 */
import SampleModel from '../models/sample';

export class Sample extends BaseWidget {

  /**
   * On load view model
   */
  constructor() {
    //Constructing the BaseWidget
    super();
  }

  beforeAppear() {
    console.log('[BEFORE APPEAR] Sample');
  }

  @exportToViewModel
  getWidgetId() {
    return this.$data.widgetId();
  }
}
