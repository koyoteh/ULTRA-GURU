module.exports = {
  apps: [{
    name: 'atassamd',
    script: 'index.js',
    max_memory_restart: '256M',
    node_args: '--max-old-space-size=256',
    instances: 1,
    exec_mode: 'fork',
    watch: false
  }]
}
