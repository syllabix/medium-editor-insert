function s3upload() {

    var upload = function(evt) {
        var file = evt.target.files[0];
        if(typeof file === 'undefined') { return; }
    }

    this.file = (function(){
        var file = document.createElement('input');
        file.type = 'file';
        file.style.display = 'none';
        file.addEventListener('change', upload);
        document.getElementsByTagName('body')[0].appendChild(file);
        return file;
    })();
}

s3upload.prototype.select = function() {
    this.file.click();
}