[Dave Hauenstein's Homepage](http://davehauenstein.com)

# What is it? #

Another In-Place Editor is a jQuery plugin that turns any element or group of elements into an Ajax in-place editor using only one line of code. It’s written using the jQuery Library, which is available free at http://jquery.com. I saw this on Flickr a while back and I thought it was really great how you can update the title and description of a photo without having to go to an admin page.

# Some Features #

  * Esc key will cancel an active editor
  * On blur will by default cause the editor to submit the value to the server. This can be overridden to cancel the submission.
  * Submit to a callback function to handle the in-place submission, rather than submitting to a URL
  * Optional validation of a blank field; By default if the field is blank, the form won’t submit and the user will receive an alert

# Demo #

http://jquery-in-place-editor.googlecode.com/svn/trunk/demo/index.html

# Usage #

It’s extremely easy to implment! The code below looks for an element with a class value of ‘name’ and applies an in-place editor to it. These are only a few of the parameters that can be passed into the editor. See below for a full listing of the parameters. It’s highly customizable.
view plaincopy to clipboardprint?

```
$(".name").editInPlace({
    url: "http://com.examplesite.www/users",
    params: "name=david"
});
```

Once the in-place editor form is submitted, it sends a POST request to the URL that is specified in the editor’s parameters along with three form fields:

  * original\_html; the original text in the in-place editor container
  * update\_value; the new value of the text from the in-place editor
  * element\_id; the id attribute of the in-place editor

# Parameters #

  * **bg\_out** (string) default: transparent hex code of background color on restore from hover
  * **bg\_over** (string) default: #ffc hex code of background color on hover
  * **callback** (function) default: null function to be called when editing is complete; cancels ajax submission to the url param
  * **cancel\_button** (string) default: 

&lt;input type=”submit” class=”inplace\_cancel” value=”Cancel”/&gt;

 image button tag to use as “Cancel” button
  * **default\_text** (string) default: “(Click here to add text)” text to show up if the element that has this functionality is empty
  * **element\_id** (string) default: element\_id name of parameter holding element\_id
  * **error** (function) this function gets called if server responds with an error
  * **field\_type** (string) “text”, “textarea”, or “select”; default: “text” The type of form field that will appear on instantiation
  * **on\_blur** (string) “save” or null; default: “save” what to do on blur; will be overridden if $param show\_buttons is true
  * **original\_html** (string) default: original\_html name of parameter holding original\_html
  * **params** (string) example: first\_name=dave&last\_name=hauenstein paramters sent via the post request to the server
  * **save\_button** (string) default: 

&lt;input type=”submit” class=”inplace\_save” value=”Save”/&gt;

 image button tag to use as “Save” button
  * **saving\_image** (string) default: uses saving text specify an image location instead of text while server is saving
  * **saving\_text** (string) default: “Saving…” text to be used when server is saving information
  * **select\_options** (string) comma delimited list of options if field\_type is set to select
  * **select\_text** (string)default text to show up in select box
  * **show\_buttons** (boolean) default: false will show the buttons: cancel or save; will automatically cancel out the onBlur functionality
  * **success** (function) default: null this function gets called if server responds with a success
  * **textarea\_cols** (integer) default: 25 set cols attribute of textarea, if field\_type is set to textarea
  * **textarea\_rows** (integer) default: 10 set rows attribute of textarea, if field\_type is set to textarea
  * **update\_value** (string) default: update\_value name of parameter holding update\_value
  * **url** (string) POST URL to send edited content
  * **value\_required** (string) default: false if set to true, the element will not be saved unless a value is entered