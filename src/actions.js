// @flow
import {createAction} from 'redux-actions'
import {retypeAction} from 'redux-retype-actions'
import {entityActions} from 'erschema-action-handlers'
import resourceActions, {actionifyName} from 'resource-action-types'
import normalize from 'erschema-normalize'
import normalizeToStore, {indexNormalizeToStore} from './normalizeToStore'
import type {$schema} from 'erschema/types'
type $$id = string | number

const getRelatedName = (name)=>`GET_RELATED_${actionifyName(name)}`

export class Action {
  constants: $$mapOf<string>;
  actions: {
    create: (ent: Object) => any,
    update: (ent: Object) => any,
    remove: (id: $$id) => any,
    get: (ent: Object) => any,
    index: (ents: Object[]) => any,
    getRelated: (id: $$id, relationshipName: string, ents: Object[]) => any,
    getAdditionalEntityProperties: (id: $$id, entityName: string, entity: Object) => any,
  };
  constructor (schema: $schema, name: string) {
    this.constants = Object.keys(resourceActions).reduce((finalResult, key) => {
      const constant = resourceActions[key](name)
      finalResult[constant] = constant
      return finalResult
    }, {})
    
    this.actions = {
      create: (entity) => entityActions.create(name, entity),
      update: (entity) => entityActions.update(name, entity),
      remove: (id) => entityActions.remove(name, id),
      get: (entity) => retypeAction(resourceActions.get(name), normalizeToStore(entity, name, schema)),
      index: (entities) => retypeAction(resourceActions.index(name), indexNormalizeToStore(entities, name, schema)),
      getRelated: (id, relationshipName, entities) => {
        if (entities instanceof Error) {
          return retypeAction(getRelatedName(name), entityActions.get(name, entities))
        }
        return retypeAction(getRelatedName(name), normalizeToStore({id, [relationshipName]: entities}, name, schema))
      },
      getAdditionalEntityProperties: (id, entityName, entity) => {
        if (entity instanceof Error) {
          return entityActions.get(entityName, entity)
        }
        return retypeAction(`GET_ADDITIONAL_ENTITY_PROPERTIES_${actionifyName(name)}`, normalizeToStore({id, ...entity}, name, schema))
      }
    }
  }
  createAction (name: string, payload: Object) {
    return createAction(name)(payload)
  }
}

export class PageAction {
  constants: $$mapOf<string>;
  actions: {
    create: (ent: Object) => any,
    update: (ent: Object) => any,
    remove: () => any,
    get: (ent: Object) => any,
    getRelated: (relationshipName: string, ents: Object[]) => any,
  };
  constructor (schema: $schema, firstSchema: $schema, name: string) {
    this.constants = Object.keys(resourceActions).reduce((finalResult, key) => {
      const constant = resourceActions[key](name)
      finalResult[constant] = constant
      return finalResult
    }, {})
    
    this.actions = {
      create: (entity) => entityActions.create('properties', {...entity, id: name}),
      update: (entity) => entityActions.update('properties', {...entity, id: name}),
      remove: () => entityActions.remove('properties', name),
      get: (entity) => retypeAction(
        `${resourceActions.get('properties')}_${actionifyName(name)}`,
        normalizeToStore(entity, name, schema, firstSchema)
      ),
      getRelated: (relationshipName, entities) => {
        if (entities instanceof Error) {
          return entityActions.get(name, entities)
        }
        return retypeAction(
          `${getRelatedName(name)}_${actionifyName(name)}`,
          normalizeToStore({[relationshipName]: entities}, name, schema, firstSchema))
      }
    }
  }
  createAction (name: string, payload: Object) {
    return createAction(name)(payload)
  }
}
