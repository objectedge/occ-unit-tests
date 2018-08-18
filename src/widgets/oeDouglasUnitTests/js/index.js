import { widgetLoader } from 'occ-components/widget-core';
import * as allViewModels from './view-models';

/**
 * We're using commonjs here because we don't have control
 * of the widget importation.
 */
module.exports = widgetLoader(allViewModels);
