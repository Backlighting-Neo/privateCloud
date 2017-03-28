const shenjianshouService = require('../service/shenjianshou')();

module.exports = {
    /*
    *    *    *    *    *    * default_schedule 格式
    ┬    ┬    ┬    ┬    ┬    ┬
    │    │    │    │    │    |
    │    │    │    │    │    └ 星期 (0 - 7) (0，7表示星期日)
    │    │    │    │    └───── 月 (1 - 12)
    │    │    │    └────────── 日 (1 - 31)
    │    │    └─────────────── 小时 (0 - 23)
    │    └──────────────────── 分钟 (0 - 59)
    └───────────────────────── 秒 (0 - 59, 可选)
    */
    default_schedule: '* /1 * * * *',

    // execute必须返回一个Promise
    execute() {
        this.logger('active tjyy8 crawler');
        return shenjianshouService.activeCrawler(30241);
    }
}