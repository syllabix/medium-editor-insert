(function(root){

	if (typeof MediumEditor !== "function") {
        throw new Error("Medium Editor is not loaded on the page.");
    }

    /*
    * functions to provide reference to their state so that unsubscribe
    * methods work in the context of the extension
    */

    var mediaInserter = function() {};
    var mediaDisabler = function() {};

	/**
	*
	* MediumEditorInsert
	* @param {Object} options:
	* - uploader: a js object that has an upload and select method
	*/

	function MediumEditorInsert(options) {
		var options = options || {};
		this.uploader = options.uploader || {};

		this.init = function(mediumEditor) {
			this.editorNode = mediumEditor.elements[0];
			this.addToolBar();
			this.base.subscribe('focus', this.positionToolBar.bind(this));
		    this.base.subscribe('editableInput', this.positionToolBar.bind(this));
		    this.base.subscribe('editableDrop', this.handleDrop);
		    this.editorNode.focus();
		}

		this.mediaOpts = {
	  		toolbar: '',
	  		active: false
	  	}

	  	this.file = (function(){
	        var file = document.createElement('input');
	        file.type = 'file';
	        file.style.display = 'none';
	        file.addEventListener('change', this.addImage.bind(this));
	        document.getElementsByTagName('body')[0].appendChild(file);
	        return file;
    	}).bind(this)();
	}

	MediumEditorInsert.prototype.addImage = function(evt) {
		if (typeof this.uploader.upload === 'undefined') {
			console.warn('Uploader has not implemented method upload, falling back to non persisted data uri');
		} else {
			this.uploader.upload(evt);
		}
	};

	MediumEditorInsert.prototype.selectImage = function() {
		this.file.click();
	};

	MediumEditorInsert.prototype.addToolBar = function() {
		var editableCoords = this.editorNode.getBoundingClientRect();
	  	var body = document.getElementsByTagName('body')[0];
	  	var mediaOpts = document.createElement('div');
	  	mediaOpts.id = 'media-opts';
	  	mediaOpts.style['top'] = editableCoords.top - 2 + 'px';
		mediaOpts.style['left'] = editableCoords.left - 31 +'px';
		body.appendChild(mediaOpts)
		this.mediaOpts.toolbar = mediaOpts;

		var btn = document.createElement('button');
		btn.id = 'mbtn';
		btn.innerHTML = '+';
		btn.addEventListener('click', this.toggleMediaOptions.bind(this));
		mediaOpts.appendChild(btn);

		var imgBtn = document.createElement('button');
		imgBtn.className = 'media-opt';
		imgBtn.innerHTML = '<i class="icon-file-img"></i>';
		imgBtn.addEventListener('click', this.selectImage.bind(this));
		mediaOpts.appendChild(imgBtn);

		var videoBtn = document.createElement('button');
		videoBtn.className = 'media-opt';
		videoBtn.innerHTML = '<i class="icon-you-tube-play"></i>';
		videoBtn.addEventListener('click', this.enableVideoInsert.bind(this));
		mediaOpts.appendChild(videoBtn);
	};

	MediumEditorInsert.prototype.positionToolBar = function(data, editable) {
	  	var editableCoords = editable.getBoundingClientRect();
		var sel = window.getSelection(), range;
		  	if (sel && sel.rangeCount > 0) {
			  	range = sel.getRangeAt(0);
			  	this.mediaOpts.toolbar.style.display = (range.endOffset === 0 && range.startOffset === 0) ? 'block' : 'none';
			  	this.turnOffOptions();
			  	var el = document.createElement('span')
			  	range.insertNode(el);
			  	var newCoords = el.getBoundingClientRect();
			  	el.parentNode.removeChild(el);
			  	this.mediaOpts.toolbar.style['top'] = newCoords.top - 2 + 'px';
			  	this.mediaOpts.toolbar.style['left'] = editableCoords.left - 31 +'px';
		  	}
	 };


	 MediumEditorInsert.prototype.disableVideoInsert = function(el) {
	    	var that = this;
	    	setTimeout(function(){
	    		that.base.unsubscribe('editablePaste', this.mediaInserter);
	    	});
		  	this.base.unsubscribe('editableKeydown', this.mediaDisabler);
		  	var p = el.parentNode;
		  	if (p !== null) {
		  		p.removeChild(el);
		  	}
 	    }

	MediumEditorInsert.prototype.enableVideoInsert = function() {
	    this.turnOffOptions();
	    var sel = window.getSelection(), range;
	    var el = document.createElement('span')
		  	if (sel && sel.rangeCount > 0) {
		  		range = sel.getRangeAt(0);
		  		el.className = 'media-placeholder';
		  		el.innerHTML = 'Paste a YouTube or Vimeo link and press enter.';
			  	range.insertNode(el);
			  	range.setStart(el, 0);
			  	range.collapse(true);
			  	sel.removeAllRanges();
			  	sel.addRange(range);
			  	this.base.elements[0].focus();
		  	}
		mediaInserter = this.insertVideo.bind(this);
		this.base.subscribe('editablePaste', mediaInserter)
		mediaDisabler = this.disableVideoInsert.bind(this, el);
		this.base.subscribe('editableInput', mediaDisabler);
	};

	MediumEditorInsert.prototype.getVideoUrl = function(text) {
	    if (text.indexOf('youtube') > -1) {
	    	var youtubeid = text.match(/.{11}$/g)[0];
			return 'https://www.youtube.com/embed/' + youtubeid;
	    } else if (text.indexOf('vimeo') > -1) {
	    	var truncatedUrl = text.match(/(https?:\/\/)?(www.)?(player.)?vimeo.com\/([a-z]*\/)*([0-9]{6,11})/g)[0];
	    	var vimeoId = truncatedUrl.match(/([0-9]{6,11})$/)[0];
	    	return 'https://player.vimeo.com/video/'+vimeoId+'?title=0&byline=0&portrait=0';
	    } else {
	    	return false;
	    }
	};

	MediumEditorInsert.prototype.insertVideo = function(e, editable) {
		e.preventDefault();
		var text = (e.originalEvent || e).clipboardData.getData('text/plain');
		var url = this.getVideoUrl(text);
		if (!url) { return }
		var frame = document.createElement('iframe');
		frame.style['float'] = 'left';
		frame.style['padding-right'] = '10px';
		frame.src = url;
		frame.width = 400;
		frame.height = 224;
		frame.frameBorder = 0;

		sel = window.getSelection();
		range = sel.getRangeAt(0);
		range.insertNode(frame);
		this.base.elements[0].focus();
		this.base.unsubscribe('editablePaste', mediaInserter);
	};

	MediumEditorInsert.prototype.turnOffOptions = function() {
		this.mediaOpts.toolbar.className = '';
	  	this.mediaOpts.active = false;
	};

	MediumEditorInsert.prototype.turnOnOptions = function() {
	  	this.mediaOpts.toolbar.className = 'active';
	  	this.mediaOpts.active = true;
	};

	MediumEditorInsert.prototype.toggleMediaOptions = function() {
		if (this.mediaOpts.active) {
	    	this.turnOffOptions();
	    } else {
	    	this.turnOnOptions();
	    }
	};

	root.MediumEditorInsert = MediumEditorInsert
})(this);