/* ASN.1 JavaScript decoder
 * Base64 JavaScript decoder
 * Copyright (c) 2008-2009 Lapo Luchini <lapo@lapo.it>
 * http://lapo.it/asn1js/
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
function Stream(a,b){if(a instanceof Stream){this.enc=a.enc;this.pos=a.pos}else{this.enc=a;this.pos=b}}Stream.prototype.get=function(a){if(a==undefined)a=this.pos++;if(a>=this.enc.length)throw"Requesting byte offset "+a+" on a stream of length "+this.enc.length;return this.enc[a]};Stream.prototype.hexDigits="0123456789abcdef";Stream.prototype.hexByte=function(a){return this.hexDigits.charAt(a>>4&15)+this.hexDigits.charAt(a&15)};
Stream.prototype.hexDump=function(a,b){for(var d="",c=a;c<b;++c)d+=this.hexByte(this.get(c));return d};Stream.prototype.parseInteger=function(a,b){return this.hexDump(a,b)};function ASN1(a,b,d,c,f){this.stream=a;this.header=b;this.length=d;this.tag=c;this.sub=f}
ASN1.prototype.content=function(){if(this.tag==undefined)return null;if(this.tag>>6!=0)return this.sub==null?null:"("+this.sub.length+")";var a=this.tag&31,b=this.posContent(),d=Math.abs(this.length);switch(a){case 2:return this.stream.parseInteger(b,b+d)}return null};ASN1.prototype.posStart=function(){return this.stream.pos};ASN1.prototype.posContent=function(){return this.stream.pos+this.header};ASN1.prototype.posEnd=function(){return this.stream.pos+this.header+Math.abs(this.length)};
ASN1.decodeLength=function(a){var b=a.get(),d=b&127;if(d==b)return d;if(d>3)throw"Length over 24 bits not supported at position "+(a.pos-1);if(d==0)return-1;for(var c=b=0;c<d;++c)b=b<<8|a.get();return b};ASN1.hasContent=function(a,b,d){if(a&32)return true;if(a<3||a>4)return false;var c=new Stream(d);a==3&&c.get();if(c.get()>>6&1)return false;try{var f=ASN1.decodeLength(c);return c.pos-d.pos+f==b}catch(e){return false}};
ASN1.decode=function(a){a instanceof Stream||(a=new Stream(a,0));var b=new Stream(a),d=a.get(),c=ASN1.decodeLength(a),f=a.pos-b.pos,e=null;if(ASN1.hasContent(d,c,a)){var h=a.pos;d==3&&a.get();e=[];if(c>=0){for(var g=h+c;a.pos<g;)e[e.length]=ASN1.decode(a);if(a.pos!=g)throw"Content size is not correct for container starting at offset "+h;}else try{for(;;){g=ASN1.decode(a);if(g.tag==0)break;e[e.length]=g}c=h-a.pos}catch(i){throw"Exception while decoding undefined length content: "+i;}}else a.pos+=c;
return new ASN1(b,f,c,d,e)};

Base64={};
Base64.decode=function(d){if(Base64.decoder==undefined){for(var a=[],b=0;b<64;++b)a["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(b)]=b;for(b=0;b<9;++b)a["= \u000c\n\r\t\u00a0\u2028\u2029".charAt(b)]=-1;Base64.decoder=a}a=[];var c=0,f=0;for(b=0;b<d.length;++b){var e=d.charAt(b);if(e=="=")break;e=Base64.decoder[e];if(e!=-1){if(e==undefined)throw"Illegal character at offset "+b;c|=e;if(++f>=4){a[a.length]=c>>16;a[a.length]=c>>8&255;a[a.length]=c&255;f=c=0}else c<<=6}}switch(f){case 1:throw"Base64 encoding incomplete: at least 2 bits missing";
case 2:a[a.length]=c>>10;break;case 3:a[a.length]=c>>16;a[a.length]=c>>8&255;break}return a};Base64.re=/-----BEGIN [^-]+-----([A-Za-z0-9+\/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+\/=\s]+)====/;Base64.unarmor=function(d){var a=Base64.re.exec(d);if(a)if(a[1])d=a[1];else if(a[2])d=a[2];return Base64.decode(d)};