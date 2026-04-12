

const nextConfig = {
  // Allow embedding YouTube iframes
  async headers() {
    return [
      {
        source: '/mirror',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default nextConfig
