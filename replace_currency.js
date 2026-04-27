const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'resources/js/Pages/Accounting/Index.tsx',
  'resources/js/Pages/Patients/Show.tsx',
  'resources/js/Pages/Dashboard.tsx',
  'resources/js/Pages/Tests/Index.tsx',
  'resources/js/Pages/Hospitals/Account.tsx',
  'resources/js/Pages/TestOrders/Index.tsx',
  'resources/js/Pages/TestOrders/Create.tsx',
  'resources/js/Pages/TestOrders/Show.tsx',
  'resources/js/Pages/TestOrders/Edit.tsx'
];

filesToProcess.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('const currency = ')) return; // Already processed

  // Find the component function to insert `const currency = auth.user.lab?.currency || '₦';`
  // Usually it looks like: export default function Something({ auth, ... }) {
  const compRegex = /(export default function [a-zA-Z0-9_]+\s*\([^)]*auth[^)]*\)\s*(?::\s*[^{]+)?\{)/;
  
  if (compRegex.test(content)) {
    content = content.replace(compRegex, "$1\n    const currency = auth?.user?.lab?.currency || '₦';\n");
  } else {
      // maybe auth is not destructured, let's look for any exported default function and usePage
      // but wait, Inertia pages always receive props. If auth is not there, we can add it, or use usePage.
      console.log('Could not find auth prop in', file);
  }

  // Replace occurrences:
  // 1. In string templates: `₦${...}` -> `${currency}${...}`
  content = content.replace(/`([^`]*)₦([^`]*)`/g, '`$1${currency}$2`');
  
  // 2. In JSX text: >₦{...} -> >{currency}{...}
  content = content.replace(/>\s*₦\s*\{/g, '>{currency}{');
  content = content.replace(/>\s*-\s*₦\s*\{/g, '>-{currency}{');
  content = content.replace(/>\s*\(\s*-\s*₦\s*\{/g, '>(-{currency}{');
  
  // 3. Plain ₦ in JSX like `(₦)` -> `({currency})`
  content = content.replace(/\(₦\)/g, '({currency})');
  content = content.replace(/₦/g, '{currency}');
  
  // Cleanup any remaining {currency}{currency} or similar issues
  content = content.replace(/\{currency\}\{currency\}/g, '{currency}');
  
  fs.writeFileSync(file, content);
  console.log('Processed', file);
});
