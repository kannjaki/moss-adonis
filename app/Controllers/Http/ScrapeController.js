'use strict'

const DataInfo = use('App/Tasks/DataInfo');

class ScrapeController {
     async index({view}){
     var contentlist = DataInfo.getContentList();
     return view.render('contentlist',{contentlist: contentlist})
    }

    async showcontent({view,params}){
      var streamlist = DataInfo.getStreamList(decodeURI(params.id));
      return view.render('show',{streamlist: streamlist,contentname: decodeURI(params.id)})
     }
}

module.exports = ScrapeController
