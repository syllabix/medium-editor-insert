MediaHandlerExtension = MediumEditor.Extension.extend({
	    name: 'medium-insert',
	    init: function () {
	    	this.subscribe('focus', this.positionMediaButton.bind(this));
		    this.subscribe('editableInput', this.positionMediaButton.bind(this));
		    this.subscribe('editableDrop', this.handleDrop.bind(this));
		    this.drawMediaButton();
		    this.base.elements[0].focus();
	  	},
	  	mediaOpts: {
	  		toolbar: '',
	  		active: false
	  	},
	  	turnOffOptions: function() {
	  		this.mediaOpts.toolbar.className = '';
	  		this.mediaOpts.active = false;
	  	},
	  	turnOnOptions: function() {
	  		var sel = window.getSelection(), range;
	  		this.mediaOpts.toolbar.className = 'active';
	  		this.mediaOpts.active = true;
	  	},
	  	toggleMediaOptions: function() {
	    	if (this.mediaOpts.active) {
	    		this.turnOffOptions();
	    	} else {
	    		this.turnOnOptions();
	    	}
	    },
	    getVideoUrl: function(text) {
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
	    },
	    insertVideo: function(e, editable) {
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
	    	this.base.unsubscribe('editablePaste', this.mediaInserter);
	    },
	    mediaInserter: function() {},
	    mediaDisabler: function() {},
	    disableVideoInsert: function(el) {
	    	var that = this;
	    	setTimeout(function(){
	    		that.base.unsubscribe('editablePaste', this.mediaInserter);
	    	});
		  	this.base.unsubscribe('editableKeydown', this.mediaDisabler);
		  	var p = el.parentNode;
		  	if (p !== null) {
		  		p.removeChild(el);
		  	}
 	    },
	    enableVideoInsert: function() {
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
		  	this.mediaInserter = this.insertVideo.bind(this);
		  	this.subscribe('editablePaste', this.mediaInserter)
		  	this.mediaDisabler = this.disableVideoInsert.bind(this, el);
		  	this.subscribe('editableInput', this.mediaDisabler);
	    },
	  	drawMediaButton: function(editableCoords) {
	  		var editableCoords = this.base.elements[0].getBoundingClientRect();
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
		  	mediaOpts.appendChild(imgBtn);

		  	var videoBtn = document.createElement('button');
		  	videoBtn.className = 'media-opt';
		  	videoBtn.innerHTML = '<i class="icon-you-tube-play"></i>';
		  	videoBtn.addEventListener('click', this.enableVideoInsert.bind(this));
		  	mediaOpts.appendChild(videoBtn);
	  	},
	  	positionMediaButton: function(data, editable) {
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
	  	},
	  	handleDrop: function(data, editable) {
	  		//to do: take image data from the drop and move it the upload module
	  	}
	});