// 导入对象深拷贝方法函数
const copy = require('./deepClone');
// 加载cheerio库，用来在服务端直接操作页面dom
const cheerio = require('cheerio');
// 引入http、https模块，根据所爬网站协议来选择合适的进行使用
const http = require('http');

//引入相关模块
const iconv = require('iconv-lite');

// 引入文件系统
const fs = require('fs');

// 目的网址
var firstUrl =
  'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2019/index.html';
var staticUrl = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2019/';

// 缓存最终数据
var resAreas = [];

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.119 Safari/537.36',
};

function start(url) {
  startTime = new Date().getTime();
  http.get(url, { headers: headers }, (res) => {
    let chunkBuffers = [];

    // console.log(url);

    res.on('data', (chunk) => {
      chunkBuffers.push(chunk);

      //下面拼接这行代码存在的缺陷：
      // 对不是utf8编码的其他格式编码字符内容的拼接会出现乱码，如果纯英文显示出来没问题，
      // 如果是中文字符，就会出现乱码问题，原因是一个汉字在UTF-8编码下占3个字节，在进行拼接操作时，
      // 一个完整的汉字字符可能会被截断，不能正常解析显示，从而造成乱码

      //具体原因:
      // 其原因是两个chunk（Buffer对象）的拼接并不正常，
      //相当于进行了buffer.toString() + buffer.toString()。
      //如果buffer不是完整的，则toString出来后的string是存在问题的(比如一个中文字被截断)
      //这样出来的string就无法被iconv正常转码。

      // 代码：
      // html += chunk;
    });

    res
      .on('end', () => {
        try {
          // 对字节进行处理
          let buffer = Buffer.concat(chunkBuffers);
          // 对window环境下的返回字符编码为gb2312编码格式的字符内容进行处理
          let html = iconv.decode(buffer, 'gb2312');

          let $provinceCheerio = cheerio.load(html);
          let $province = $provinceCheerio('.provincetr');
          let provinceObj = [];

          let $td = '';
          $province.each(function (index, item) {
            $td = $provinceCheerio(item).find('td');
            // 2019专用写法
            let isLastData;
            if (index == $province.length - 1) {
              isLastData = true;
            }
            //end
            $td.each(function (i, item) {
              // 2019专用写法
              if (isLastData && i == $td.length - 1) {
                return;
              }
              //end
              let resObj = {
                href: $provinceCheerio(item).find('a').attr('href'),
                provinceCode: $provinceCheerio(item)
                  .find('a')
                  .attr('href')
                  .split('.')[0],
                provinceName: $provinceCheerio(item).find('a').text(),
              };
              provinceObj.push(resObj);
            });
          });
          resAreas = copy.deepClone(provinceObj);
          // 获取城市
          getCity(provinceObj);
        } catch (e) {
          console.error(e.message);
        }
      })
      .on('error', (e) => {
        console.error(`出现错误: ${e.message}`);
      });
  });
}

function getCity(provinceObj) {
  // console.log(provinceObj);
  for (let i = 0; i < provinceObj.length; i++) {
    setTimeout(() => {
      let url = staticUrl + provinceObj[i].href;
      http.get(url, { headers: headers }, (res) => {
        let chunkBuffers = [];

        res.on('data', (chunk) => {
          chunkBuffers.push(chunk);
        });

        res
          .on('end', () => {
            try {
              // 对字节进行处理
              let buffer = Buffer.concat(chunkBuffers);
              // 对window环境下的返回字符编码为gb2312编码格式的字符内容进行处理
              let html = iconv.decode(buffer, 'gb2312');

              let $cityCheerio = cheerio.load(html);

              let $city = $cityCheerio('.citytr');
              let cityObj = [];

              let $td = '';
              $city.each(function (i, item) {
                $td = $cityCheerio(item).find('td');
                let href = '';
                let code = '';
                let name = '';

                $td.each(function (i, item) {
                  if (i === 0) {
                    href = $cityCheerio(item).find('a').attr('href');
                    code = $cityCheerio(item).find('a').text();
                  } else {
                    name = $cityCheerio(item).text();
                  }
                });

                cityObj.push({
                  href: href,
                  cityCode: code,
                  cityName: name,
                });
              });
              resAreas[i].city = copy.deepClone(cityObj);
              // 获取区、县
              getCounty(i, cityObj);
            } catch (e) {
              console.error(e.message);
            }
          })
          .on('error', (e) => {
            console.error(`出现错误: ${e.message}`);
          });
      });
    }, 30000 * i);
  }
}

function getCounty(n, cityObj) {
  // console.log(cityObj);
  for (let i = 0; i < cityObj.length; i++) {
    setTimeout(() => {
      let url = staticUrl + cityObj[i].href;
      http.get(url, { headers: headers }, (res) => {
        let chunkBuffers = [];

        res.on('data', (chunk) => {
          chunkBuffers.push(chunk);
        });

        res
          .on('end', () => {
            try {
              // 对字节进行处理
              let buffer = Buffer.concat(chunkBuffers);
              // 对window环境下的返回字符编码为gb2312编码格式的字符内容进行处理
              let html = iconv.decode(buffer, 'gb2312');

              let $countyCheerio = cheerio.load(html);

              let $county = $countyCheerio('.countytr');
              let countyObj = [];

              let $td = '';

              $county.each(function (i, item) {
                $td = $countyCheerio(item).find('td');
                let href = '';
                let code = '';
                let name = '';

                $td.each(function (i, item) {
                  if ($countyCheerio(item).find('a').length > 0) {
                    href = $countyCheerio(item).find('a').attr('href');
                    if (i === 0) {
                      code = $countyCheerio(item).find('a').text();
                    } else {
                      name = $countyCheerio(item).find('a').text();
                    }
                  } else {
                    if (i === 0) {
                      code = $countyCheerio(item).text();
                    } else {
                      name = $countyCheerio(item).text();
                    }
                  }
                });

                countyObj.push({
                  href: href,
                  countyCode: code,
                  countyName: name,
                });
              });
              resAreas[n].city[i].county = copy.deepClone(countyObj);
              // 获取城镇乡
              getTown(n, i, countyObj);
            } catch (e) {
              console.error(e.message);
            }
          })
          .on('error', (e) => {
            console.error(`出现错误: ${e.message}`);
          });
      });
    }, 1000 * i);
  }
}

function getTown(n, m, countyObj) {
  // console.log(countyObj);
  for (let i = 0; i < countyObj.length; i++) {
    if (countyObj[i].href != '') {
      let link = countyObj[i].href.split('/')[1].slice(0, 2) + '/';
      let url = staticUrl + link + countyObj[i].href;
      http.get(url, { headers: headers }, (res) => {
        let chunkBuffers = [];

        res.on('data', (chunk) => {
          chunkBuffers.push(chunk);
        //   console.log(chunkBuffers);
        });

        res
          .on('end', () => {
            try {
              // 对字节进行处理
              let buffer = Buffer.concat(chunkBuffers);
              // 对window环境下的返回字符编码为gb2312编码格式的字符内容进行处理
              let html = iconv.decode(buffer, 'gb2312');

              let $townCheerio = cheerio.load(html);

              let $town = $townCheerio('.towntr');
              let townObj = [];

              let $td = '';

              $town.each(function (i, item) {
                $td = $townCheerio(item).find('td');
                let code = '';
                let name = '';

                $td.each(function (i, item) {
                  if ($townCheerio(item).find('a').length > 0) {
                    if (i === 0) {
                      code = $townCheerio(item).find('a').text();
                    } else {
                      name = $townCheerio(item).find('a').text();
                    }
                  } else {
                    if (i === 0) {
                      code = $townCheerio(item).text();
                    } else {
                      name = $townCheerio(item).text();
                    }
                  }
                });

                townObj.push({
                  townCode: code,
                  townName: name,
                });
              });
              resAreas[n].city[m].county[i].town = copy.deepClone(townObj);
              // console.log(resAreas);
            } catch (e) {
              console.error(e.message);
            }
          })
          .on('error', (e) => {
            console.error(`出现错误: ${e.message}`);
          });
      });
    }
  }
  // 将数据写入文件
  fs.writeFile('2019国家行政区域.json', JSON.stringify(resAreas), (err) => {
    if (err) throw err;
    console.log('文件已保存');
  });
}
// 获取省城数据，入口函数
start(firstUrl);
