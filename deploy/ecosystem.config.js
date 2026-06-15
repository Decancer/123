// PM2 进程管理配置
// 放至: /var/www/blog/ecosystem.config.js
// 启动: pm2 start ecosystem.config.js
// 注意：环境变量建议用 node --env-file=.env 方式加载，见 SKILL.md Step 9

module.exports = {
  apps: [
    {
      name: "blog",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/blog/app",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "800M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/var/www/blog/logs/error.log",
      out_file: "/var/www/blog/logs/output.log",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
