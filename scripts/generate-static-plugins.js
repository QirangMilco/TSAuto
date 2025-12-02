/**
 * 生成静态插件导入映射脚本
 * 用于在构建时扫描插件目录并生成静态导入映射
 */

import fs from 'fs';
import path from 'path';

// 插件目录路径
const PLUGINS_DIR = path.resolve(new URL('../plugins', import.meta.url).pathname);
// 输出文件路径
const OUTPUT_FILE = path.resolve(new URL('../src/core/plugin/static-plugins.generated.ts', import.meta.url).pathname);

/**
 * 递归扫描目录，获取所有插件文件
 */
function scanPlugins(dir, basePath = '') {
  const plugins = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 递归扫描子目录
      plugins.push(...scanPlugins(fullPath, path.join(basePath, file)));
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      // 添加插件文件
      plugins.push(path.join(basePath, file));
    }
  }
  
  return plugins;
}

/**
 * 生成静态插件导入映射
 */
function generateStaticPlugins() {
  console.log('Generating static plugin imports...');
  
  // 扫描插件目录
  const pluginFiles = scanPlugins(PLUGINS_DIR);
  
  // 生成导入语句
  const imports = pluginFiles.map((file, index) => {
    const importPath = `../../../plugins/${file}`;
    const variableName = `plugin_${index}`;
    return `import ${variableName} from '${importPath}';`;
  });
  
  // 生成导出映射
  const exports = pluginFiles.map((file, index) => {
    const importPath = `/plugins/${file}`;
    const variableName = `plugin_${index}`;
    return `  '${importPath}': ${variableName},`;
  });
  
  // 生成文件内容
  const content = `/**
 * 静态插件导入映射
 * 自动生成，请勿手动修改
 * 生成时间: ${new Date().toISOString()}
 */

${imports.join('\n')}

/**
 * 静态插件导入映射
 */
export const staticPluginImports = {
${exports.join('\n')}
};
`;
  
  // 写入文件
  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
  
  console.log(`Generated static plugin imports for ${pluginFiles.length} plugins`);
  console.log(`Output file: ${OUTPUT_FILE}`);
}

// 执行生成
if (import.meta.url === `file://${process.argv[1]}`) {
  generateStaticPlugins();
}

export { generateStaticPlugins };
