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
    var deactivateMediaFmt = function() {};

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
			this.editorNode = this.base.elements[0];
			this.addInsertButton();
			this.base.subscribe('focus', this.positionInsertBtn.bind(this));
		    this.base.subscribe('editableInput', this.positionInsertBtn.bind(this));
		    this.base.subscribe('editableDrop', this.handleDrop);
		    this.base.subscribe('editableKeydownDelete', this.watchForMediaElementDelete.bind(this));

		    this.mediaToolBar = (function(){
		    	var toolbar = document.createElement('div');
		    	toolbar.id = 'medium-insert-media-toolbar';
		    	toolbar.className = 'medium-editor-toolbar stalker-toolbar medium-toolbar-arrow-under';
		    	document.getElementsByTagName('body')[0].appendChild(toolbar);
		    	var buttonList = document.createElement('ul');
		    	var buttons = [{type:'left', icon: 'left-align'}, {type:'full', icon: 'center-align'}, {type:'right', icon: 'right-align'}];
		    	for (i=0;i<buttons.length;i++) {
		    		var li = document.createElement('li');
		    		toolbar.appendChild(li);
		    		var btn = document.createElement('button');
		    		btn.className = 'medium-editor-action medium-editor-action-'+buttons[i].type;
		    		btn.setAttribute('data-action', buttons[i].type);
		    		btn.innerHTML = '<i class="icon-'+buttons[i].icon+'"></i>';
		    		li.appendChild(btn);
		    		btn.addEventListener('click', this.formatMediaContainer.bind(this, btn));
		    	}

		    	return toolbar;
		    }).bind(this)();
		}

		this.mediaOpts = {
	  		toolbar: '',
	  		active: false,
	  		loaded: true
	  	}

	  	this.activeMediaContainer = '';

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
		var img = document.createElement('img');
		img.className = 'inset-blog-photo full';
		var reader = new FileReader();
		reader.onload = function(e) {
			img.src = e.target.result;
		}
		var file = evt.target.files[0];
		reader.readAsDataURL(file);

		sel = window.getSelection();
		range = sel.getRangeAt(0);
		range.insertNode(img);
		range.setStartAfter(img);
		range.setEndAfter(img);
		sel.removeAllRanges();
		sel.addRange(range);
		this.base.elements[0].focus();
		img.addEventListener('click', this.mediaFormatter.bind(this, img));

		if (typeof this.uploader.upload === 'undefined') {
			console.warn('Uploader has not implemented method upload, falling back to non persisted data uri');
		} else {
			this.uploader.upload(evt, function(res){
				if (res.success) {
					img.src = res.url;
				} else {
					console.log('image failed...');
				}
			});
		}
	};

	MediumEditorInsert.prototype.selectImage = function() {
		this.file.click();
	};

	MediumEditorInsert.prototype.addInsertButton = function() {
		var editableCoords = this.editorNode.getBoundingClientRect();
	  	var body = document.getElementsByTagName('body')[0];
	  	var mediaOpts = document.createElement('div');
	  	mediaOpts.id = 'media-opts';
	  	mediaOpts.style['top'] = editableCoords.top - 2 + 'px';
		mediaOpts.style['left'] = editableCoords.left - 31 +'px';
		//mediaOpts.style['display'] = 'none';
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

	MediumEditorInsert.prototype.formatMediaContainer = function(btn) {
		var action = btn.getAttribute('data-action');
		this.activeMediaContainer.className = this.activeMediaContainer.className.replace(/\s(left|full|right)/g, '');
		this.activeMediaContainer.className += ' ' + action;
		this.positionMediaToolBar();
	};

	MediumEditorInsert.prototype.positionInsertBtn = function(data, editable) {
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
			  	this.mediaOpts.toolbar.style['top'] = newCoords.top + window.scrollY - 4 + 'px';
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

	MediumEditorInsert.prototype.deactivateMediaContainerFormatting = function() {
		this.activeMediaContainer.className = this.activeMediaContainer.className.replace(/(\sselected|selected)/g, '');
		this.mediaToolBar.style['visibility'] = 'hidden';
		this.base.unsubscribe('editableInput', deactivateMediaFmt);
	}

	MediumEditorInsert.prototype.activateMediaContainerFormatting = function(container) {
		deactivateMediaFmt = this.deactivateMediaContainerFormatting.bind(this);
		if (this.activeMediaContainer !== '') {
			deactivateMediaFmt();
		}
		this.activeMediaContainer = container;
		this.mediaToolBar.style['visibility'] = 'visible';
		this.base.subscribe('editableInput', deactivateMediaFmt);
		this.positionMediaToolBar();
	};

	MediumEditorInsert.prototype.positionMediaToolBar = function() {
		var container = this.activeMediaContainer;
		var toolbar = this.mediaToolBar;

		var coords = container.getBoundingClientRect()
		toolbar.style['top'] = (coords.top + window.scrollY) - (toolbar.offsetHeight + 10) + 'px';
		var mediaHalf = Math.floor(toolbar.offsetWidth / 2);
		var center = Math.floor(container.offsetWidth / 2) + coords.left - mediaHalf + 'px';
		toolbar.style['left'] = center;
	};

	MediumEditorInsert.prototype.watchForMediaElementDelete = function() {
		var node = document.getSelection().anchorNode
		if (typeof node.className !== 'undefined') {
			if (node.className.indexOf('video-container') > -1) {
				node.parentNode.removeChild(node);
				return
			}
		}
	}

	MediumEditorInsert.prototype.mediaFormatter = function(container) {
		if (container.className.indexOf('selected') > -1) {
			container.className = container.className.replace(/\sselected/g, '');
		} else {
			this.editorNode.blur();
			container.className += ' selected';
			this.activateMediaContainerFormatting(container);
		}
	};

	MediumEditorInsert.prototype.insertVideo = function(e, editable) {
		e.preventDefault();
		var text = (e.originalEvent || e).clipboardData.getData('text/plain');
		var url = this.getVideoUrl(text);
		if (!url) { return }

		var frame = document.createElement('iframe');
		frame.src = url;
		frame.width = '100%';
		frame.height = '100%';
		frame.frameBorder = 0;

		var container = document.createElement('div')
		container.className = 'video-container full';
		container.addEventListener('click', this.mediaFormatter.bind(this, container));


		sel = window.getSelection();
		range = sel.getRangeAt(0);
		range.insertNode(container);
		container.appendChild(frame);
		range.setStartAfter(container);
		range.setEndAfter(container);
		sel.removeAllRanges();
		sel.addRange(range);
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