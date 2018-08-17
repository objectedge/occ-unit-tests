/**
 * @fileoverview Notifier Class
 * Wraps the PubSub of Notification messages in simple methods, which
 * can be easily integrated into widgets.
 * 
 */define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'notifier',
  
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'pubsub', 'jquery'],
  
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, pubsub, $) {
    
    "use strict";
    
    /**
     * A view model representing messages of different types.
     * <p>
     * The available types are:
     * <ul>
     *   <li>success</li>
     *   <li>info</li>
     *   <li>warning</li>
     *   <li>error</li>
     * </ul>
     * Each message may be marked as 'dismissable', and may also cause
     * the browser to scroll to in, bringing it into view when it is shown,
     * via the 'scrollToMessage' flag.
     * @private
     * @class MessageModel
     * @param {string} id The message ID.
     * @param {string} text The message text.
     * @param {string} type The message type.
     * @param {boolean} dismissable Is the message dismissable?
     * @param {boolean} scrollToMessage Scroll to message when shown?
     * 
     * @property {string} id The message ID.
     * @property {string} text The message text.
     * @property {string} type The message type.
     * @property {boolean} dismissable Is the message dismissable?
     * @property {boolean} scrollToMessage Scroll to message when shown?
     * @property {string} alertClass The CSS class, based on the type of the message.
     */
    function MessageModel(id, text, type, dismissable, scrollToMessage) {
        var self = this;
        self.id = ko.observable(id);
        self.text = ko.observable(text);
        self.type = ko.observable(type);
        self.dismissable = ko.observable(dismissable);
        self.scrollToMessage = ko.observable(scrollToMessage);
        
        self.alertClass = ko.computed(function(){
          return "alert alert-" + self.type();
        });
      }
    
    /**
     * Creates a Notifier object.
     * @private
     * @class Notifier
     * @property {string[]} types Message Types.
     */
    function Notifier() {
      var self = this;
      
      self.types = {
        SUCCESS: 'success',
        WARNING: 'warning',
        INFO: 'info',
        ERROR: 'error'
      };
      
      /**
       * Generic Send Message method.
       * Used to send a notification message which will be
       * displayed in the site header.
       * @function Notifier#sendMessage
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {string} type Type of Message.
       * @param {boolean} dismissable Can this message be dismissed.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendMessage = function(id, text, type, dismissable, scrollToMessage) {
        var message = new MessageModel(id, text, type, dismissable, scrollToMessage);
        
        $.Topic(pubsub.topicNames.NOTIFICATION_ADD).publishWith(
          message,[{message:"success"}]);  
      };
    
      /**
       * Send an error message.
       * @function Notifier#sendError
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendError = function(id, text, scrollToMessage) {
        self.sendMessage(id, text, self.types.ERROR, true, scrollToMessage);
      };
      
      /**
       * Send a warning message.
       * @function Notifier#sendWarning
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendWarning = function(id, text, scrollToMessage) {
        self.sendMessage(id, text, self.types.WARNING, true, scrollToMessage);
      };
      
      /**
       * Send a success message.
       * @function Notifier#sendSuccess
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendSuccess = function(id, text, scrollToMessage) {
        self.sendMessage(id, text, self.types.SUCCESS, true, scrollToMessage);
      };
      
      /**
       * Send an info message.
       * @function Notifier#sendInfo
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendInfo = function(id, text, scrollToMessage) {
        self.sendMessage(id, text, self.types.INFO, true, scrollToMessage);
      };
      
      // Page message store to hold deferred messages to be displayed when a particular page has been properly loaded.
      var pageMessageStore = {};
      
      /**
       * Method defers displaying of message until the page specified is displayed.
       * @function Notifier#sendMessageToPage
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       * @param {string} pageId The page id that the error message should be displayed on e.g. checkout
       * @param {boolean} dismissible Can this message be dismissed.
       * @param {string} type The message type.
       */
      self.sendMessageToPage = function(id, text, scrollToMessage, pageId, dismissible, type) {
        if (!pageMessageStore[pageId]) {
          pageMessageStore[pageId] = $.Deferred();
        }
        
        pageMessageStore[pageId].done(function() {
          setTimeout(function() {
            self.sendMessage(id, text, type, dismissible, scrollToMessage);
          },300);
          
          pageMessageStore[pageId] = null;
        });
      };
      
      $.Topic(pubsub.topicNames.PAGE_LAYOUT_UPDATED).subscribe(function(pageData, pageEvent) {
        // Resolve page message deferred object if one exists for this page.
        if (pageEvent.pageId && pageMessageStore[pageEvent.pageId]) {
          pageMessageStore[pageEvent.pageId].resolve();
        }
      }); 
      
      /**
       * Send an error message to page.
       * @function Notifier#sendErrorToPage
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       * @param {string} pageId The page id that the error message should be displayed on e.g. checkout
       * @param {boolean} dismissible Can this message be dismissed.
       */
      self.sendErrorToPage = function(id, text, scrollToMessage, pageId, dismissible) {
        self.sendMessageToPage(id, text, scrollToMessage, pageId, (dismissible ? true : false), self.types.ERROR);
      };
      
      /**
       * Send a warning message to a page.
       * @function Notifier#sendWarningToPage
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       * @param {string} pageId The page id that the error message should be displayed on e.g. checkout
       * @param {boolean} dismissible Can this message be dismissed.
       */
      self.sendWarningToPage = function(id, text, scrollToMessage, pageId, dismissible) {
        self.sendMessageToPage(id, text, scrollToMessage, pageId, dismissible, self.types.WARNING);
      };
      
      /**
       * Send a success message to page.
       * @function Notifier#sendSuccessToPage
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       * @param {string} pageId The page id that the error message should be displayed on e.g. checkout
       * @param {boolean} dismissible Can this message be dismissed.
       */
      self.sendSuccessToPage = function(id, text, scrollToMessage, pageId, dismissible) {
        self.sendMessageToPage(id, text, scrollToMessage, pageId, dismissible, self.types.SUCCESS);
      };
      
      /**
       * Send an info message to page.
       * @function Notifier#sendInfoToPage
       * @param {string} id ID of Source Component/Widget.
       * @param {string} text Message Text.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       * @param {string} pageId The page id that the error message should be displayed on e.g. checkout
       * @param {boolean} dismissible Can this message be dismissed.
       */
      self.sendInfoToPage = function(id, text, scrollToMessage, pageId, dismissible) {
        self.sendMessageToPage(id, text, scrollToMessage, pageId, dismissible, self.types.INFO);
      };
      
      /**
       * Generic Send Message method with templates.
       * Used to send a notification message which will be
       * displayed in the site header. This will call a 
       * specific template in the notifications widget that will handle the 
       * view of the notifications.
       * @function Notifier#sendTemplateMessage
       * @param {string} id ID of Source Component/Widget.
       * @param {Object} viewModel The view model containing the data for
       *                 custom notification.
       * @param {string} templateType The name of the template to be used for
       *                 custom notification.
       * @param {string} type Type of Message.
       * @param {boolean} dismissable Can this message be dismissed?
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendTemplateMessage = function(id, viewModel, templateName, type, dismissable, scrollToMessage) {
        // Set the text to empty for now. This will be updated in the notifications
        // widget later on with a proper template.
        var message = new MessageModel(id, templateName, type, dismissable, scrollToMessage);
        // Send the custom template notification.
        $.Topic(pubsub.topicNames.NOTIFICATION_TEMPLATE_ADD).publish(
            message, viewModel, templateName);
      };
    
      /**
       * Send an error message with a template.
       * @function Notifier#sendTemplateError
       * @param {string} id ID of Source Component/Widget
       * @param {Object} viewModel The view model containing the data for
       *                 custom notification.
       * @param {string} templateType The name of the template to be used for
       *                 custom notification.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendTemplateError = function(id, viewModel, templateName, scrollToMessage) {
        self.sendTemplateMessage(id, viewModel, templateName, self.types.ERROR, false, scrollToMessage);
      };
      
      /**
       * Send a warning message with a template.
       * @function Notifier#sendTemplateWarning
       * @param {string} id ID of Source Component/Widget
       * @param {Object} viewModel The view model containing the data for
       *                 custom notification.
       * @param {string} templateType The name of the template to be used for
       *                 custom notification.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendTemplateWarning = function(id, viewModel, templateName, scrollToMessage) {
        self.sendTemplateMessage(id, viewModel, templateName, self.types.WARNING, true, scrollToMessage);
      };
      
      /**
       * Send a success message with a template.
       * @function Notifier#sendTemplateSuccess
       * @param {string} id ID of Source Component/Widget
       * @param {Object} viewModel The view model containing the data for
       *                 custom notification.
       * @param {string} templateType The name of the template to be used for
       *                 custom notification.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendTemplateSuccess = function(id, viewModel, templateName, scrollToMessage) {
        self.sendTemplateMessage(id, viewModel, templateName, self.types.SUCCESS, true, scrollToMessage);
      };
      
      /**
       * Send an info message with a template.
       * @function Notifier#sendTemplateInfo
       * @param {string} id ID of Source Component/Widget
       * @param {Object} viewModel The view model containing the data for
       *                 custom notification.
       * @param {string} templateType The name of the template to be used for
       *                 custom notification.
       * @param {boolean} scrollToMessage Whether or not to scroll to the message.
       */
      self.sendTemplateInfo = function(id, viewModel, templateName, scrollToMessage) {
        self.sendTemplateMessage(id, viewModel, templateName, self.types.INFO, true, scrollToMessage);
      };
      
      
      /**
       * Generic Clear Message method.
       * Used to clear down previously sent messages. 
       * id and type must match original message.
       * @function Notifier#clearMessage
       * @param {string} id ID of the Source Component/Widget.
       * @param {string} type Type of Message.
       */
      self.clearMessage = function(id, type) {
        var message = new MessageModel(id, '', type, false, false);
        
        $.Topic(pubsub.topicNames.NOTIFICATION_DELETE).publishWith(
           message,[{message:"success"}]);      
      };
      
      /**
       * Clear an error message.
       * @function Notifier#clearError
       * @param {string} id ID of the Source Component/Widget
       */
      self.clearError = function(id) {
        self.clearMessage(id, self.types.ERROR);
      };
      
      /**
       * Clear a warning message.
       * @function Notifier#clearWarning
       * @param {string} id ID of the Source Component/Widget
       */
      self.clearWarning = function(id) {
        self.clearMessage(id, self.types.WARNING);
      };
      
      /**
       * Clear a success message.
       * @function Notifier#clearSuccess
       * @param {string} id ID of the Source Component/Widget
       */
      self.clearSuccess = function(id) {
        self.clearMessage(id, self.types.SUCCESS);
      };
      
      /**
       * Clear an info message.
       * @function Notifier#clearInfo
       * @param {string} id ID of the Source Component/Widget
       */
      self.clearInfo = function(id) {
        self.clearMessage(id, self.types.INFO);
      };
      
      return self;
    }
    
    
    return new Notifier();
  }
);

