const { networkInterfaces } = require('os');
const { spawn } = require('child_process');

function getLocalIpAddress() {
  const interfaces = networkInterfaces();
  const preferredNames = ['wi-fi', 'wifi', 'ethernet', 'eth', 'wlan', 'lan'];
  let fallbackIp = null;

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    const lowerName = name.toLowerCase();

    // Skip virtual/docker/vethernet adapters
    if (
      lowerName.includes('vethernet') ||
      lowerName.includes('virtual') ||
      lowerName.includes('vbox') ||
      lowerName.includes('vmware') ||
      lowerName.includes('docker') ||
      lowerName.includes('loopback')
    ) {
      continue;
    }

    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        if (preferredNames.some((pref) => lowerName.includes(pref))) {
          return { ip: net.address, interfaceName: name };
        }
        if (!fallbackIp) {
          fallbackIp = { ip: net.address, interfaceName: name };
        }
      }
    }
  }

  return fallbackIp || { ip: '127.0.0.1', interfaceName: 'localhost' };
}

const { ip, interfaceName } = getLocalIpAddress();

console.log('\n==================================================');
console.log(`🌐 DETECTED ACTIVE NETWORK INTERFACE : [${interfaceName}]`);
console.log(`📡 BINDING EXPO TO IP ADDRESS        : ${ip}`);
console.log('==================================================\n');

process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;

const userArgs = process.argv.slice(2);
const args = ['expo', 'start', '--host', 'lan', ...userArgs];

const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    REACT_NATIVE_PACKAGER_HOSTNAME: ip,
  },
});

child.on('error', (err) => {
  console.error('Failed to start Expo:', err);
});
