exports.mix = function(obj, properties, test){
  for (var key in properties){
    if(!(test && obj[key])) obj[key] = properties[key];
  }
  return obj;
};

exports.getOrCreate = function(dest, name, value){
  return (dest[name] = (dest[name] || value));
};

exports.genUid = function(length, range){
  length = length || 32;
  range = range || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var uid = "";
  for(var i=0; i < length; i++){
    uid += range.charAt(Math.floor(Math.random() * range.length));
  }
  return uid;
};

exports.genShortUid = function(length){
  return exports.genUid(length || 4, "0123456789");
};
