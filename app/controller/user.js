
const ms     = require('ms');

module.exports = app => {
    class UserController extends app.Controller {



        * login () {
            const {ctx, service} = this;

            const [phone,
                   password,
                   rememberMe] = [
                       ctx.request.body.phone,
                       ctx.helper.sha1(ctx.request.body.password, this.config.salt), // 对 Password 进行 Sha1 加密
                       ctx.request.body.rememberMe
                   ];
            ctx.helper.debug("账号密码")
            ctx.helper.debug(phone, password);

            // 登录接口
            const userInfo = yield service.user.login(phone, password);

            if(userInfo.length != 0) {
                ctx.session.user = userInfo;
                if(rememberMe != void 0 && rememberMe) {
                    this.session.maxAge = ms('7d'); // 这一周都记住我
                }
                ctx.helper.sendData(200, userInfo, '登录成功');
                return;
            } else {
                //判断当前用户是否存在，返回密码错误或者未注册
                const isUserExist = yield service.user.findByPhone(phone);
                if(isUserExist.length === 1) {
                  ctx.helper.handleError(401, null, '登录失败，密码错误');
                } else {
                  ctx.helper.handleError(401, null, '登录失败，用户未注册');
                }
                return;
            }

        }

        * register() {
            const {ctx, service}    = this;
            const [phone, password] = [ctx.request.body.phone,
                                       ctx.helper.sha1(ctx.request.body.password, this.config.salt)];

            try {
                const addUser = yield service.user.register(phone, password);
                // 返回用户数据
                const data = {};
                ctx.helper.sendData(200, data, '注册成功')
            } catch(err) {
                ctx.helper.handleError(400, null, '当前用户已经存在');
            }
        }

        * changePassword() {
            const {ctx, service} = this;
            const [phone, password] = [ctx.request.body.phone,
                                       ctx.helper.sha1(ctx.request.body.password, this.config.salt)];
            try {
                const Users = yield service.user.findByPhone(phone);
                const UserId = Users[0].UserId;
                const changeUserPassword = yield service.user.updatePswByUserId(password, UserId);
                if(changeUserPassword) {
                    ctx.helper.sendData(200, null, '修改密码成功')
                    return ;
                }

                return ctx.helper.handleError(400, null, '修改密码失败');

            } catch(err) {
                ctx.helper.sendData(400, null, "用户不存在")
                ctx.helper.recordErr(err);
                return ;
            }

        }

    }
    return UserController;
}
