const Obj = require('./src/assets/2019.json');
const fs = require('fs');

// 把源数据先变成目标数据的规则
let oldDataRule = [];
Obj.forEach((el) => {
  let oldObj = {
    provinceCode: el[1],
    provinceName: el[2],
    city: [],
  };
  let cityObj = {
    cityCode: el[3],
    cityName: el[4],
    country: [],
  };
  let countryObj = {
    countryCode: el[5],
    countryName: el[6],
    town: [],
  };
  let townObj = {
    townCode: el[7],
    townName: el[8],
  };
  oldObj.city.push(cityObj);
  cityObj.country.push(countryObj);
  countryObj.town.push(townObj);
  oldDataRule.push(oldObj);
});

/**
 * 先去重，后合并
 * 1、源数据去重
 * 2、把去重后的数据和源数据中相同name的数据合并citys
 */
function treeView(oldDataRule, provinceCode, city) {
  let newData = [];
  let newObj = {};
  let newDataRule = JSON.parse(JSON.stringify(oldDataRule));
  newDataRule.forEach((el, i) => {
    if (!newObj[el[provinceCode]]) {
      newData.push(el);
      newObj[el[provinceCode]] = true;
    } else {
      newData.forEach((el) => {
        if (el[provinceCode] === oldDataRule[i][provinceCode]) {
          el[city] = [...el[city], ...oldDataRule[i][city]];
        }
      });
    }
  });
  return newData;
}
let newProvince = treeView(oldDataRule, 'provinceCode', 'city');
newProvince.forEach((el) => {
  let newCity = treeView(el.city, 'cityCode', 'country');
  el.city = newCity;
  newCity.forEach((el) => {
    let newCountry = treeView(el.country, 'countryCode', 'town');
    el.country = newCountry;
  });
});
console.log(newProvince);
// 将数据写入文件
fs.writeFile('2019国家行政区域.json', JSON.stringify(newProvince), (err) => {
  if (err) throw err;
  console.log('文件已保存');
});
