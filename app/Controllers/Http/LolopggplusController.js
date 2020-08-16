'use strict'
var request = require('request');
var sl = require('await-sleep');
var ladders = new Map();
var count = 0;
var headers = {
  "X-Riot-Token": "RGAPI-0d7fa870-b58f-40b1-b289-284c35a75f72"
}
class LolopggplusController {
  async showLadder({
    view,
    params
  }) {
     if(params.id == "riot.txt"){
      return view.render("riot")
    }
    var ladder = await ladders.get(params.id);
    if (ladder == null) {
      return view.render("opggplus")
    } else {
      let opggurl;
      if (params.id == "KR") {
        opggurl = "https://www.op.gg/summoner/userName=";
      } else if (params.id == "JP1") {
        opggurl = "https://jp.op.gg/summoner/userName=";
      } else if (params.id == "NA1") {
        opggurl = "https://na.op.gg/summoner/userName=";
      }
      return view.render("opggplus", {
        opggurl: opggurl,
        LadderAll: ladder["ALL"],
        LadderTop: ladder["TOP"],
        LadderJungle: ladder["JUNGLE"],
        LadderMid: ladder["MID"],
        LadderAdc: ladder["ADC"],
        LadderSupport: ladder["SUPPORT"]
      })
    }
  }
  static async run() {
    await this.addLadder("Challenger", "JP1");
    await this.addLadder("Grandmaster", "JP1");
    await this.addLadder("Master", "JP1");
    await this.addLadder("Challenger", "NA1");
    await this.addLadder("Grandmaster", "NA1");
    await this.addLadder("Challenger", "KR");
    await this.addLadder("Grandmaster", "KR");
    await this.sortAll();
  }
  static async getLore(accountId, country) {
    return new Promise(async function (resolve, reject) {
      var options = {
        url: 'https://' + country + '.api.riotgames.com/lol/match/v4/matchlists/by-account/' + accountId,
        method: 'GET',
        headers: headers,
        qs: {
          queue: '420',
          endIndex: "30"
        },
        json: true,
      }
      request(options, function (error, response, body) {
        var playlore = [];
        var matches = body.matches;
        if (matches == null) {
          console.log("[Server:unknown] accountId => " + accountId)
          resolve("Null");
          return;
        }
        matches.forEach(function (v) {
          var Plane = v.lane;
          if (v.lane == "BOTTOM" || v.lane == "NONE") {
            if (v.role == "DUO_SUPPORT") {
              Plane = "SUPPORT";
            } else {
              Plane = "ADC";
            }
          }
          playlore.push(Plane);
        });
        var temp = {};
        for (let i = 0; i < playlore.length; i++) {
          if (temp[playlore[i]] == undefined) {
            temp[playlore[i]] = 1;
          } else {
            temp[playlore[i]] += 1;
          }
        }
        var max = 0,
          maxEle;
        for (const i in temp) {
          if (temp[i] > max) {
            max = temp[i];
            maxEle = i;
          }
        }
        resolve(maxEle);
      })
    });
  }
  static async getaccountId(v, country) {
    return new Promise(async function (resolve, reject) {
      var options = {
        url: 'https://' + country + '.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + encodeURI(v.summonerName),
        method: 'GET',
        headers: headers,
        json: true,
      }
      request(options, async function (error, response, body) {
        var playerlore = await LolopggplusController.getLore(body.accountId, country);
        resolve([playerlore, body.profileIconId]);
        return playerlore;
      })
    });
  }
  static async addLadder(league, country) {
    return new Promise(async function (resolve, reject) {
      var requestUrl;
      switch (league) {
      case "Challenger":
        requestUrl = 'https://' + country + '.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5';
        break;
      case "Grandmaster":
        requestUrl = 'https://' + country + '.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5';
        break;
      case "Master":
        requestUrl = 'https://' + country + '.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5';
        break;
      }
      var options = {
        url: requestUrl,
        method: 'GET',
        headers: headers,
        json: true,
      }
      request(options, async function (error, response, body) {
        var ladder = ladders.get(country);
        var ALL = (ladder == null) ? [] : ladder["ALL"];
        var TOP = (ladder == null) ? [] : ladder["TOP"];
        var JUNGLE = (ladder == null) ? [] : ladder["JUNGLE"];
        var MID = (ladder == null) ? [] : ladder["MID"];
        var ADC = (ladder == null) ? [] : ladder["ADC"];
        var SUPPORT = (ladder == null) ? [] : ladder["SUPPORT"];
        if (ladder == null) {
          ladder = {};
        }
        if(body == null){//null
          console.log("[Server:Error] Can't do addLadder("+league+","+country+") Body =>"+body)
          resolve("addLadder"); 
          return;
        }
        for await (const v of body.entries) {
          if (count == 45) {
            count = 0;
            await sl(1000 * 120);
          } else {
            count++;
          }
          var accountdata = await LolopggplusController.getaccountId(v, country);
          var winrate = Math.floor(v.wins / await (v.wins + v.losses) * 100);
          var playerinfo = {
            name: v.summonerName,
            tier: league,
            leaguePoints: v.leaguePoints,
            wins: v.wins,
            losses: v.losses,
            rank: v.rank,
            lore: accountdata[0],
            iconid: accountdata[1],
            winrate: winrate
          };
          switch (accountdata[0]) {
          case "TOP":
            TOP.push(playerinfo)
            ALL.push(playerinfo)
            break;
          case "JUNGLE":
            JUNGLE.push(playerinfo)
            ALL.push(playerinfo)
            break;
          case "MID":
            MID.push(playerinfo)
            ALL.push(playerinfo)
            break;
          case "ADC":
            ADC.push(playerinfo)
            ALL.push(playerinfo)
            break;
          case "SUPPORT":
            SUPPORT.push(playerinfo)
            ALL.push(playerinfo)
            break;
          default:
            console.log("This data has not a lore");
            ALL.push(playerinfo)
            break;
          }
        }
        ladder["TOP"] = await TOP;
        ladder["JUNGLE"] = await JUNGLE;
        ladder["MID"] = await MID;
        ladder["ADC"] = await ADC;
        ladder["SUPPORT"] = await SUPPORT;
        ladder["ALL"] = await ALL;
        ladders.set(country, ladder);
        console.log("\u001b[32m[Server] add Ladder("+league+","+country+")\u001b[0m")
        resolve("addLadder");
      })
    });
  }
  static async getLadder(country) {
    return ladders.get(country);
  }
  static async sortAll() {
    return new Promise(async function (resolve, reject) {
      for await (const leaguename of ladders) {
        let leagueladder = leaguename[1];
        for await (const leaguelore of Object.keys(leaguename[1])) {
          let leagueplayer = leagueladder[leaguelore];
          leagueplayer.sort(function (a, b) {
            return b.leaguePoints - a.leaguePoints;
          });
          leagueladder[leaguelore] = leagueplayer;
        }
        ladders.set(leaguename[0], leagueladder)
      }
      var date = new Date();
      console.log("\u001b[32m[Server: " + date.toLocaleString("ja") + " ] Updated OPGG+\u001b[0m");
      resolve('Sort');
    });
  }
}
module.exports = LolopggplusController
