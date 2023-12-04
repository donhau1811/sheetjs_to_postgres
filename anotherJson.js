var jsonArray = [
  {
    "CHI PHÍ QUẢN LÝ VÀ VẬN HÀNH CÁC TÒA NHÀ": null,
    "__EMPTY": "C.6.3",
    "__EMPTY_1": 0,
    "__EMPTY_2": 0,
    "__EMPTY_3": 0,
    "__EMPTY_4": 0,
    "__EMPTY_5": 0,
    "__EMPTY_6": 0,
    "__EMPTY_7": 0,
    "__EMPTY_8": 0,
    "__EMPTY_9": 0
  },
  {
    "CHI PHÍ QUẢN LÝ VÀ VẬN HÀNH CÁC TÒA NHÀ": null,
    "__EMPTY": "C.6.4",
    "__EMPTY_1": null,
    "__EMPTY_2": 0,
    "__EMPTY_3": 0,
    "__EMPTY_4": 0,
    "__EMPTY_5": 0,
    "__EMPTY_6": 0,
    "__EMPTY_7": 0,
    "__EMPTY_8": 0,
    "__EMPTY_9": 0
  }
];

var transformedArray = jsonArray.map(function(obj) {
  var transformedObj = {
    "account_key": obj["__EMPTY"],
    "_empty_1": obj["__EMPTY_1"] !== null ? obj["__EMPTY_1"] : 2,
    "_empty_2": obj["__EMPTY_2"] !== null ? obj["__EMPTY_2"] : 3,
    "_empty_3": obj["__EMPTY_3"] !== null ? obj["__EMPTY_3"] : 4,
    "_empty_4": obj["__EMPTY_4"] !== null ? obj["__EMPTY_4"] : 5,
    "_empty_5": obj["__EMPTY_5"] !== null ? obj["__EMPTY_5"] : 6,
    "_empty_6": obj["__EMPTY_6"] !== null ? obj["__EMPTY_6"] : 7,
    "_empty_7": obj["__EMPTY_7"] !== null ? obj["__EMPTY_7"] : 8,
    "_empty_8": obj["__EMPTY_8"] !== null ? obj["__EMPTY_8"] : 12,
    "_empty_9": obj["__EMPTY_9"] !== null ? obj["__EMPTY_9"] : 9
  };

  return transformedObj;
});

console.log(transformedArray);