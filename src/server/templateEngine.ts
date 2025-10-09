import Mustache from 'mustache';
import { faker } from '@faker-js/faker';

export interface ExecutionContext {
  req: any;
  faker?: typeof faker;
}

export class TemplateEngine {

    static applyTemplating(
        inputParameters: Record<string, any>,
        props: Record<string, any>
    ): Record<string, any> {
        const result: Record<string, any> = {};

        for (const key in inputParameters) {
            const value = inputParameters[key];

            if (typeof value === 'string') {
                result[key] = value.replace(/{{(.*?)}}/g, (_, match) => {
                    const trimmed = match.trim();
                    return props[trimmed] !== undefined ? String(props[trimmed]) : '';
                });
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
   * Renders a template string with the given context
   */
  static render(template: string, context: ExecutionContext): string {
    // Disable HTML escaping in Mustache
    Mustache.escape = (text) => text;
    
    // First, process faker function calls
    let processed = template.replace(/{{faker\.(.*?)}}/g, (_, fakerPath) => {
      try {
        const trimmed = fakerPath.trim();
        // Parse the faker path (e.g., "string.uuid()" or "person.firstName()")
        const match = trimmed.match(/^([\w.]+)\((.*?)\)$/);
        if (!match) {
          console.warn(`Invalid faker syntax: {{faker.${fakerPath}}}`);
          return `{{faker.${fakerPath}}}`;
        }
        
        const [, path, args] = match;
        const pathParts = path.split('.');
        
        // Navigate through faker object
        let fn: any = faker;
        for (const part of pathParts) {
          fn = fn[part];
          if (!fn) {
            console.warn(`Faker method not found: ${path}`);
            return `{{faker.${fakerPath}}}`;
          }
        }
        
        // Execute the function
        if (typeof fn === 'function') {
          const result = args ? fn(JSON.parse(`[${args}]`)) : fn();
          return String(result);
        }
        
        return String(fn);
      } catch (error) {
        console.error(`Error executing faker function: {{faker.${fakerPath}}}`, error);
        return `{{faker.${fakerPath}}}`;
      }
    });
    
    return Mustache.render(processed, context);
  }

  /**
   * Recursively processes an object, rendering all template strings
   */
  static renderObject(obj: any, context: ExecutionContext): any {
    if (typeof obj === 'string') {
      return this.render(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.renderObject(item, context));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.renderObject(obj[key], context);
      }
      return result;
    }

    return obj;
  }
}
