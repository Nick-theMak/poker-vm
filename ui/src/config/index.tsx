import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { createConfig, http } from 'wagmi'
import { metaMask } from 'wagmi/connectors'

export const projectId = import.meta.env.VITE_PROJECT_ID || "";
if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const metadata = {
  name: 'AppKit',
  description: 'AppKit Example',
  url: 'https://app.block52.xyz/',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// for custom networks visit -> https://docs.reown.com/appkit/react/core/custom-networks
export const networks = [base] as [AppKitNetwork, ...AppKitNetwork[]]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  projectId: projectId,
  networks,
  ssr: true
})


export const config = createConfig({
  chains: [base],
  connectors: [metaMask()],
  transports: {
    [base.id]: http(),
  },
})