import type {
  FieldDefinitionNode,
  GraphQLSchema,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
} from 'graphql';

import type { ValidationSchemaPluginConfig } from './config';
import type { SchemaVisitor } from './types';
import { Visitor } from './visitor';

export abstract class BaseSchemaVisitor implements SchemaVisitor {
  protected importTypes: string[] = [];
  protected enumDeclarations: string[] = [];

  constructor(
    protected schema: GraphQLSchema,
    protected config: ValidationSchemaPluginConfig,
  ) {}

  abstract importValidationSchema(): string;

  buildImports(): string[] {
    if (this.config.importFrom && this.importTypes.length > 0) {
      return [
        this.importValidationSchema(),
        `import ${this.config.useTypeImports ? 'type ' : ''}{ ${this.importTypes.join(', ')} } from '${
          this.config.importFrom
        }'`,
      ];
    }
    return [this.importValidationSchema()];
  }

  abstract initialEmit(): string;

  createVisitor(scalarDirection: 'input' | 'output' | 'both'): Visitor {
    return new Visitor(scalarDirection, this.schema, this.config);
  }

  protected abstract buildInputFields(
    fields: readonly (FieldDefinitionNode | InputValueDefinitionNode)[],
    visitor: Visitor,
    name: string
  ): string;

  protected buildTypeDefinitionArguments(
    node: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    visitor: Visitor,
  ) {
    return visitor.buildArgumentsSchemaBlock(node, (typeName, field) => {
      this.importTypes.push(typeName);
      return this.buildInputFields(field.arguments ?? [], visitor, typeName);
    });
  }
}
