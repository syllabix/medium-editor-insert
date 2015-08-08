function s3upload(bucket, signatureURL) {
    this.bucket = bucket;
    this.signatureURL = signatureURL
}

s3upload.prototype.upload = function(evt) {
    var file = evt.target.files[0];
    if(typeof file === 'undefined') { return; }
    if (typeof this.signatureURL === 'undefined') {
        throw new Error('No resource specified to generate s3 signature');
    }
    var s3form = new FormData()
    s3form.append('key', keyprefix + '/'+ file.name);
    s3form.append('AWSAccessKeyId', data.AWSAccessKeyId);
    s3form.append('acl', 'public-read');
    s3form.append('policy', data.policy);
    s3form.append('signature', data.signature);
    s3form.append('Content-Type', file.type);
    s3form.append('file', file);
}