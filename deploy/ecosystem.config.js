// PM2 进程管理配置
// 放至: /var/www/blog/ecosystem.config.js
// 启动: pm2 start ecosystem.config.js
// 自启: pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: "mashiro-blog",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/blog",
      env_file: "/var/www/blog/.env",
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
