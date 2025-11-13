import Hero from '../components/Hero';
import { Link } from 'react-router-dom';
import { 
  ArrowUpTrayIcon, 
  FolderIcon, 
  ShieldCheckIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

export default function Home() {
  const steps = [
    {
      icon: ArrowUpTrayIcon,
      title: 'Upload & Encrypt',
      description: 'Upload your documents with client-side encryption. Generate your DID and request verifiable credentials.',
      link: '/upload',
      linkText: 'Start Upload',
    },
    {
      icon: FolderIcon,
      title: 'Manage Vault',
      description: 'View and manage your encrypted credentials. Create presentations to share with verifiers.',
      link: '/vault',
      linkText: 'Open Vault',
    },
    {
      icon: ArrowPathIcon,
      title: 'Retrieve Files',
      description: 'Retrieve your encrypted documents using CIDs or from your stored credentials.',
      link: '/retrieve',
      linkText: 'Retrieve',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Verify Credentials',
      description: 'Verify the authenticity of verifiable presentations and check revocation status.',
      link: '/verify',
      linkText: 'Verify Now',
    },
  ];

  return (
    <div>
      <Hero />

      {/* How it works */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Four simple steps to manage your decentralized identity and credentials
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="card-hover">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg mb-4">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  {step.description}
                </p>
                <Link
                  to={step.link}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm inline-flex items-center"
                >
                  {step.linkText}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security notice */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔒 Your Security is Our Priority
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>All encryption happens client-side in your browser</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>Private keys never leave your device</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>You control your identity and credentials</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>Open-source and auditable</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
