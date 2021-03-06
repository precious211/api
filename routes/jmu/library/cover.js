var request = require('request');
var cherrio = require('cheerio');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/:isbn', function (req, res, next) {
    var bookid = req.params.bookid;
    var url = 'http://smjslib.jmu.edu.cn/bookinfo.aspx?ctrlno=' + bookid;

    console.log('SEARCH BOOK:ID\t', bookid);

    var options = {
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36 Query String Parameters view source view URL encoded",
            "Accept-Language": "zh-CN,zh;q=0.8,en;q=0.6"
        }
    };

    var _res = res;

    request(options, function (error, res, body) {
        if (!error && res.statusCode == 200) {

            var $ = cherrio.load(body);

            var bookInfo = {};
            var infoes = [];

            $('.tb tbody tr').each(function (i, elem) {
                var info = {};

                //获取 馆藏地
                info.location = elem.children[1].children[0].children[0].data;

                //获取 索书号
                info.callNumber = elem.children[3].children[0].data;

                //获取 借阅状态
                info.bookStatus = elem.children[11].children[0].data.trim();

                //获取 借阅类型
                info.bookType = elem.children[13].children[0].data.trim();

                infoes.push(info);
            });

            var introTag = $('#ctl00_ContentPlaceHolder1_bookcardinfolbl')[0];
            if (introTag != undefined) {
                bookInfo.status = "success";
                for (var i = 0, len = introTag.children.length; i < len; i++) {
                    if (introTag.children[i].type == 'tag'
                        && introTag.children[i].name == 'br'
                        && introTag.children[i].next.type == 'tag'
                        && introTag.children[i].next.name == 'br') {
                        bookInfo.intro = introTag.children[i].prev.data.trim();
                    }
                }

                //获取 ISBN
                var txt = '';
                introTag.children.map(function (child, index) {
                    if (child.data) {
                        txt += child.data;
                    }
                });

                bookInfo.ISBN = txt.split('ISBN').reverse()[0].split('：')[0].split('-').join('');

                bookInfo.infoes = infoes;
            } else {
                bookInfo.status = "fail";
                bookInfo.message = "NO_DETAIL_FOUND";
            }

            _res.jsonp(bookInfo);
        }
    });
});

module.exports = router;