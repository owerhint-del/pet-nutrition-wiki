module.exports = {
  apps: [
    {
      name: 'pet-nutrition-wiki',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/opt/pet-nutrition-wiki',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
    },
  ],
}
