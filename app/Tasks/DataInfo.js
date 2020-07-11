'use strict'

const Task = use('Task')
const puppeteer = require('puppeteer');
var streams = new Map();
var newcontent = new Map();
var contentList = [{
	name: "League of Legends",
	poster: "https://static-cdn.jtvnw.net/ttv-boxart/League%20of%20Legends-285x380.jpg",
	mildom: "LOL",
	twich: "League of Legends"
}, {
	name: "VALORANT",
	poster: "https://static-cdn.jtvnw.net/ttv-boxart/VALORANT-285x380.jpg",
	mildom: "Valorant",
	twich: "VALORANT"
}, {
	name: "APEX Legends",
	poster: "https://static-cdn.jtvnw.net/ttv-boxart/Apex%20Legends-285x380.jpg",
	mildom: "APEX",
	twich: "Apex Legends"
}];
class DataInfo extends Task {
	static get schedule() {
		return '0 */1 * * * *'
	}

	async handle() {
		for (const content of contentList) {
			newcontent.set(content.name, []);
			await this.updateMildom(content)
			await this.updateTwitch(content)
			await this.SortStreamlist(content);
			streams.set(content.name,newcontent.get(content.name));
    }
    var date = new Date();
    console.log("[Server: "+date.toLocaleString("ja")+" ] Updated contents");
	}


	async updateMildom(content) {
		return new Promise(function(resolve, reject) {
			(async() => {
				var streamlist = newcontent.get(content.name);
				
				const browser = await puppeteer.launch({
					headless: true
        });

				const page = await browser.newPage();

				// Emulates an iPhone X
				await page.setUserAgent(
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36"
        );

				await page.setViewport({
					width: 1920,
					height: 969
				});

				await page.goto('https://www.mildom.com/channel_detail?channel_key=' +
					content.mildom);

				await page.waitForSelector('.infinite-load__container');
				let html = await page.evaluate(() => document.body.innerHTML);

				//stream list 
				const items = await page.$$('.live-item')
				for await (const item of items) {

					const sname = await (await (await item.$(
						'div.live-item__main-nickname')).getProperty('textContent')).jsonValue();
					const sintro = await (await (await item.$('div.live-item__main-intro'))
						.getProperty('textContent')).jsonValue();
					const surl = await (await (await item.$('a.live-item__real-container'))
						.getProperty('href')).jsonValue();
					const simg = await (await (await item.$('img')).getProperty('src')).jsonValue();
					const sview = await (await (await item.$('div.live-item__viewer-num'))
						.getProperty('textContent')).jsonValue();

					var addStream = {
						platform: "Mildom",
						intro: sintro,
						name: sname,
						url: surl,
						img: simg,
						views: sview
					};
					streamlist.push(addStream);

				}
        await browser.close();
				newcontent.set(content.name, streamlist);
				//console.log(content.name+" add content on Mildom");
				resolve('addMildom');

			})()
		});
	}
	async updateTwitch(content) {
		return new Promise(function(resolve, reject) {
			var streamlist = newcontent.get(content.name);
			var request = require('request');
			//ヘッダーを定義

			var headers = {
				'Client-ID': 'wc29qar1meeqzdonnrmbj7y25gaamv',
				'Authorization': 'OAuth cfabdegwdoklmawdzdo98xt2fo512y',
				'Accept': 'application/vnd.twitchtv.v5+json'
			}

			//オプションを定義
			var options = {
				url: 'https://api.twitch.tv/kraken/streams/',
				method: 'GET',
				headers: headers,
				qs: {
					game: content.twich,
					language: "ja",
					limit: "100"
				},
				json: true,
			}

			//リクエスト送信
			request(options, function(error, response, body) {
				//コールバックで色々な処理
				body.streams.forEach(function(stream) {
					var addStream = {
						platform: "Twitch",
						intro: stream.channel.status,
						name: stream.channel.display_name,
						url: stream.channel.url,
						img: stream.preview.large,
						views: stream.viewers
					};
					streamlist.push(addStream);
				});
				newcontent.set(content.name, streamlist);
				//console.log(content.name+" add content on Twich");
				resolve('addTwich');
			})
		});
	}
	async SortStreamlist(content) {
		return new Promise(function(resolve, reject) {
			var streamlist = newcontent.get(content.name);
			streamlist.sort(function(a, b) {
				return b.views - a.views;
			});
			newcontent.set(content.name, streamlist);
			//console.log(content.name+" sorted");
			resolve('Sort');
		});
	}
	static getStreamList(contentname) {
		return streams.get(contentname);
	}
	static getContentList() {
		return contentList;
	}

}

module.exports = DataInfo
