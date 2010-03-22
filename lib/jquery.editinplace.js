/*

Another In Place Editor - a jQuery edit in place plugin

Copyright (c) 2009 Dave Hauenstein

Authors:
	Dave Hauenstein
	Martin Häcker <spamfaenger [at] gmx [dot] de>

To minify use the google closure compiler at http://closure-compiler.appspot.com/

License:
This source file is subject to the BSD license bundled with this package.
Available online: {@link http://www.opensource.org/licenses/bsd-license.php}
If you did not receive a copy of the license, and are unable to obtain it,
email davehauenstein@gmail.com, and I will send you a copy.

Project home:
http://code.google.com/p/jquery-in-place-editor/

Version 1.0.2

TODO: 
- Support overriding individual options with the metadata plugin
- expand the interface to submit to functions to make it easier to integrate into custom applications
  (fold in show progress, offer callbacks for different lifecycle events, ...)
- support live events to trigger inline editing to ease highly dynamic websites better
- select on choosing if no buttons are shown (should be able to disable this if wanted)

REFACT:
- include spinner image as data url into javascript
- support an array of options for select_options
- rename callbackShowErrors to callback_show_errors for consistency
- consider to extract the inline error function
- consider to enable the client to specify a prefix / namespace for all classes in the inplace editor to make it easier to avoid clashes with outside css

*/

(function($){

$.fn.editInPlace = function(options) {
	
	var settings = $.extend({}, $.fn.editInPlace.defaults, options);
	
	preloadImage(settings.saving_image);
	
	return this.each(function() {
		// TODO: should prevent setting an inline editor twice on one selector - especially with the same options
		new InlineEditor(settings, $(this)).init();
	});
};

/// Switch these through the dictionary argument to $(aSelector).editInPlace(overideOptions)
$.fn.editInPlace.defaults = {
	url:				"", // string: POST URL to send edited content
	bg_over:			"#ffc", // string: background color of hover of unactivated editor
	bg_out:				"transparent", // string: background color on restore from hover
	show_buttons:		false, // boolean: will show the buttons: cancel or save; will automatically cancel out the onBlur functionality
	save_button:		'<button class="inplace_save">Save</button>', // string: image button tag to use as “Save” button
	cancel_button:		'<button class="inplace_cancel">Cancel</button>', // string: image button tag to use as “Cancel” button
	params:				"", // string: example: first_name=dave&last_name=hauenstein extra paramters sent via the post request to the server
	field_type:			"text", // string: "text", "textarea", or "select";  The type of form field that will appear on instantiation
	default_text:		"(Click here to add text)", // string: text to show up if the element that has this functionality is empty
	textarea_rows:		10, // integer: set rows attribute of textarea, if field_type is set to textarea
	textarea_cols:		25, // integer: set cols attribute of textarea, if field_type is set to textarea
	select_text:		"Choose new value", // string: default text to show up in select box
	select_options:		"", // string or array: Used if field_type is set to 'select'. Can be comma delimited list of options 'textandValue,text:value', Array of options ['textAndValue', 'text:value'] or array of arrays ['textAndValue', ['text', 'value']]. The last form is especially usefull if your labels or values contain colons)
	saving_text:		"Saving...", // string: text to be used when server is saving information
	saving_image:		"", // string: uses saving text specify an image location instead of text while server is saving
	value_required:		false, // boolean: if set to true, the element will not be saved unless a value is entered
	element_id:			"element_id", // string: name of parameter holding the id or the editable
	update_value:		"update_value", // string: name of parameter holding the updated/edited value
	original_html:		"original_html", // string: name of parameter holding original_html value of the editable
	on_blur:			"save", // string: "save" or null; what to do on blur; will be overridden if show_buttons is true
	callback:			null, // function: function to be called when editing is complete; cancels ajax submission to the url param
	callbackShowErrors: true, // boolean: if errors should be shown as alerts when submitting to a callback
	success:			null, // function: this function gets called if server responds with a success
	error:				function(request){ // function: this function gets called if server responds with an error
							alert("Failed to save value: " + request.responseText || 'Unspecified Error');
                        }
};


function InlineEditor(settings, dom) {
	this.settings = settings;
	this.dom = dom;
	this.isEditorOpen = false; // REFACT: consider to adopt hidden/shown vs. open/closed editor
	this.originalHTML = null; // REFACT: rename, not sure what a better name would be though
};
$.fn.editInPlace.InlineEditor = InlineEditor;

$.extend(InlineEditor.prototype, {
	init: function() {
		if('' === this.dom.html())
		 	this.dom.html(this.settings.default_text);
		
		var settings = this.settings;
		this.dom
			.hover(
				function(){ $(this).css("background", settings.bg_over); },
				function(){ $(this).css("background", settings.bg_out); })
			.click(this.handleClickOnClosedEditor(this.settings, this.dom));
	},
	
	// REFACT: use this.settings instead of settings
	handleClickOnClosedEditor: function(settings) {
		var that = this;
		
		return function(){
			// prevent re-adding the editor when it is already open
			if (that.isEditorOpen)
				return;
			that.isEditorOpen = true;
			
			//save original text - for cancellation functionality
			that.originalHTML = that.dom.html();
			that.replaceContentWithEditor();
			// that.connectEventsToEditor();
			hookUpEvents();
			
			function hookUpEvents() {
				var form = that.dom.find("form");
				
				form.find(".inplace_field").focus().select();
				form.find(".inplace_cancel").click(that.cancelEditorAction);
				form.find(".inplace_save").click(saveAction);
				
				if ( ! that.settings.show_buttons) {
					if ("save" === that.settings.on_blur)
						// TODO: Firefox has a bug where blur is not reliably called when focus is lost 
						//       (for example by another editor appearing)
						form.find(".inplace_field").blur(saveAction);
					else
						form.find(".inplace_field").blur(that.cancelEditorAction);
				}
				
				// REFACT: should only cancel while the focus is inside the element
				$(document).keyup(function(event){
					if (event.keyCode == 27) { // escape key
						that.cancelEditorAction();
					}
				});
				
				form.submit(saveAction);
			}
			
			function saveAction() {
				that.dom.css("background", that.settings.bg_out);
				var this_elem = $(this);
				var new_html = (this_elem.is('form')) ? this_elem.children(0).val() : this_elem.parent().children(0).val();
				
				/* set saving message */
				if("" !== that.settings.saving_image)
					var saving_message = '<img src="' + that.settings.saving_image + '" alt="Saving..." />';
				else
					var saving_message = that.settings.saving_text;
				that.dom.html(saving_message);
				
				if ("" !== that.settings.params)
					that.settings.params = "&" + that.settings.params;
					
				if (that.settings.callback) {
					html = that.settings.callback(that.dom.attr("id"), new_html, that.originalHTML, that.settings.params);
					that.isEditorOpen = false;
					if (html)
						that.dom.html(html);
					else {
						/* failure; put original back */
						if (that.settings.callbackShowErrors) {
							// REFACT: This should be overridable in the that.settings object
							alert("Failed to save value: " + new_html);
						}
						that.dom.html(that.originalHTML);
					}
				} else if (that.settings.value_required && (new_html == "" || new_html == undefined)) {
					that.isEditorOpen = false;
					that.dom.html(that.originalHTML);
					// REFACT: This should be overridable in the that.settings object
					alert("Error: You must enter a value to save this field");
				} else {
					$.ajax({
						url: that.settings.url,
						type: "POST",
						data: that.settings.update_value + '=' + new_html + '&' + that.settings.element_id + '=' + that.dom.attr("id") + that.settings.params + '&' + that.settings.original_html + '=' + that.originalHTML,
						dataType: "html",
						complete: function(request){
							that.isEditorOpen = false;
						},
						success: function(html){
							/* if the text returned by the server is empty, */
	 								/* put a marker as text in the original element */
							var new_text = html || that.settings.default_text;
							
							/* put the newly updated info into the original element */
							that.dom.html(new_text);
							if (that.settings.success) that.settings.success(html, that.dom);
						},
						error: function(request) {
							that.dom.html(that.originalHTML);
							if (that.settings.error) that.settings.error(request, that.dom);
						}
					});
				}

				return false;
			}
		};
	},
	
	replaceContentWithEditor: function() {
		var buttons_html  = (this.settings.show_buttons) ? this.settings.save_button + ' ' + this.settings.cancel_button : '';
		var editorElement = this.createEditorElement(); // needs to happen before anything is replaced
		/* insert the new in place form after the element they click, then empty out the original element */
		this.dom.html('<form class="inplace_form" style="display: inline; margin: 0; padding: 0;"></form>')
			.find('form')
				.append(editorElement)
				.append(buttons_html);
	},
	
	createEditorElement: function() {
		if (-1 === $.inArray(this.settings.field_type, ['text', 'textarea', 'select']))
			throw "Unknown field_type <fnord>, supported are 'text', 'textarea' and 'select'";
		
		// if html is our default text, clear it out to prevent saving accidentally
		// REFACT: clearing should only happen if the element was actually filled with the default text earlier
		if (this.originalHTML === this.settings.default_text) this.dom.html('');
		
		// REFACT: this should be saved on initialization time so we don't have to re-get it 
		// then its just neccessary to make sure it's reinitialized when the editor is activated again
		var initialContent = trim(this.dom.text());
		var nameAndClass = ' name="inplace_value" class="inplace_field" ';
		
		if ("text" === this.settings.field_type) {
			var editor = $('<input type="text"' + nameAndClass + '/>');
			editor.val(initialContent);
			return editor;
		}
		else if ("textarea" === this.settings.field_type) {
			var editor = $('<textarea' + nameAndClass + 'rows="' + this.settings.textarea_rows + '" cols="' + this.settings.textarea_cols + '"></textarea>');
			editor.val(initialContent);
			return editor;
		}
		else if ("select" === this.settings.field_type) {
			var editor = $('<select' + nameAndClass + '><option disabled="true" value="">' + this.settings.select_text + '</option></select>');
			
			var optionsArray = this.settings.select_options;
			if ( ! $.isArray(optionsArray))
				optionsArray = optionsArray.split(',');
				
			for (var i=0; i<optionsArray.length; i++) {
				
				var currentTextAndValue = optionsArray[i];
				if ( ! $.isArray(currentTextAndValue))
					currentTextAndValue = currentTextAndValue.split(':');
				
				var value = trim(currentTextAndValue[1] || currentTextAndValue[0]);
				var text = trim(currentTextAndValue[0]);
				
				var selected = (value == this.originalHTML) ? 'selected="selected" ' : '';
				var option = $('<option ' + selected + ' ></option>').val(value).text(text);
				editor.append(option);
			}
			return editor;
		}
	},
	
	connectEventsToEditor: function() {
	},
	
	cancelEditorAction: function() {
		this.isEditorOpen = false;
		this.dom.css("background", this.settings.bg_out);
		this.dom.html(this.originalHTML);
		return false;
	},
	
	missingCommaErrorPreventer:''
});



// Private helpers .......................................................

/* preload the loading icon if it is configured */
function preloadImage(anImageURL) {
	if ('' === anImageURL)
		return;
	
	var loading_image = new Image();
	loading_image.src = anImageURL;
}

function trim(aString) {
	return aString
		// trim
		.replace(/^\s+/, '')
		.replace(/\s+$/, '');
}

})(jQuery);