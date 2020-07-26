'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const DataInfo = use('App/Controllers/Http/DataInfoController');


class MaketaskProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    //
    DataInfo.get();
    const Scheduler = use('Adonis/Addons/Scheduler') //Why do this use it...
    Scheduler.run()
    const opgg = use('App/Controllers/Http/LolopggplusController');
    opgg.run();
  }

  /**
   * Attach context getter when all providers have
   * been registered
   *
   * @method boot
   *
   * @return {void}
   */
  boot () {
    //
  }
}

module.exports = MaketaskProvider
