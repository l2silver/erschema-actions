// @flow
import {enableRetyping, retypeAction} from 'redux-retype-actions'
import {enableBatching, batchActions} from 'redux-batched-actions'
import recompose from 'redux-compose-hors'
import resourceActions, {generateActionName as actionifyName} from 'resource-action-types'
import * as entityActions from 'erschema-redux-immutable/actions/entities'
import * as relationshipActions from 'erschema-redux-immutable/actions/relationships'

import preNormalize, {indexNormalize as preIndexNormalize} from 'erschema-redux-immutable/actions/normalize'

import type {$schema} from 'erschema/types'

const combineIndexes = (normalizedActions)=>{
  const {indexEntities, indexRelationships} = normalizedActions
  return [...indexEntities, ...indexRelationships]
}

const normalize = (...args)=>{
  return batchActions(combineIndexes(preNormalize(...args)))
}

const indexNormalize = (...args)=>{
  return batchActions(
    preIndexNormalize(...args).reduce((finalResult, normalizedActions)=>{
      return finalResult.concat(combineIndexes(normalizedActions))
    }, [])
  )  
}
type $$id = string | number

type $relationship = {
  entityName: string,
  name: string,
  id: $$id,
};


const getRelatedName = (name)=>`GET_RELATED_${actionifyName(name)}`;
const concatRelatedName = (name)=>`CONCAT_RELATED_${actionifyName(name)}`;

export default class Actions {
  entities: {
    create: (ent: Object) => any,
    update: (ent: Object) => any,
    remove: (id: $$id) => any,
    get: (ent: Object) => any,
    index: (ents: Object[]) => any,
    getRelated: (id: $$id, relationshipName: string, ents: Object[]) => any,
    getAdditionalEntityProperties: (id: $$id, entityName: string, entity: Object) => any,
    concatRelated: (id: $$id, relationshipName: string, ents: Object[]) => any,
    createRelated: (ent: Object, relationship: $relationship) => any,
    createRelatedPage: (ent: Object, page: string, relationshipName: string) => any,
  };
  name: string;
  constructor (schema: $schema, name: string) {
    this.name = name
    this.entities = {
      create: (entity) => entityActions.create(name, entity),
      update: (entity) => entityActions.update(name, entity),
      remove: (id) => entityActions.remove(name, id),
      get: (entity) => retypeAction(`NORMALIZE_${resourceActions.get(name)}`, normalize(entity, name, schema)),
      index: (entities) => retypeAction(`NORMALIZE_${resourceActions.index(name)}`, indexNormalize(entities, name, schema)),
      getRelated: (id, relationshipName, entities) => {
        if (entities instanceof Error) {
          return retypeAction(getRelatedName(name), entityActions.get(name, entities))
        }
        return retypeAction(getRelatedName(name), normalize({id, [relationshipName]: entities}, name, schema))
      },
      getAdditionalEntityProperties: (id, entityName, entity) => {
        if (entity instanceof Error) {
          return entityActions.get(entityName, entity)
        }
        return retypeAction(`GET_ADDITIONAL_ENTITY_PROPERTIES_${actionifyName(name)}`, normalize({id, ...entity}, name, schema))
      },
      concatRelated: (id, relationshipName, entities) => {
        if (entities instanceof Error) {
          return entityActions.get(name, entities)
        }
        return retypeAction(
          `${concatRelatedName(name)}_${actionifyName(name)}`,
          normalize({id, [relationshipName]: entities}, name, schema, undefined,
          {
            relationships: {
              [name]: {
                [relationshipName]: {
                  concat: true
                }
              }
            }
          }))
      },
      createRelated: (entity, relationship) =>
        retypeAction(
          `CREATE_RELATED_${actionifyName(this.name)}_${actionifyName(
            relationship.entityName
          )}`,
          batchActions([
            this.entities.create(entity),
            relationshipActions.link(relationship.entityName, {
              relationshipName: relationship.name,
              id: relationship.id,
              relationshipValue: entity.id,
            }),
          ])
        ),
      createRelatedPage: (
        entity: { id: $$id },
        page: string,
        relationshipName: string
      ) =>
        this.entities.createRelated(entity, {
          entityName: 'pages',
          name: relationshipName,
          id: page,
        }),
    }
  }
}

export class PageActions {
  entities: {
    create: (ent: Object) => any,
    update: (ent: Object) => any,
    remove: () => any,
    get: (ent: Object) => any,
    getRelated: (relationshipName: string, ents: Object[]) => any,
    concatRelated: (relationshipName: string, ents: Object[]) => any,
  };
  constructor (schema: $schema, firstSchema: $schema, name: string) {
    this.entities = {
      create: (entity) => entityActions.create('pages', {...entity, id: name}),
      update: (entity) => entityActions.update('pages', {...entity, id: name}),
      remove: () => entityActions.remove('pages', name),
      get: (entity) => retypeAction(
        `${resourceActions.get('pages')}_${actionifyName(name)}`,
        normalize(entity, 'pages', schema, firstSchema[name])
      ),
      getRelated: (relationshipName, entities) => {
        if (entities instanceof Error) {
          return entityActions.get(name, entities)
        }
        return retypeAction(
          `${getRelatedName(name)}_${actionifyName(relationshipName)}`,
          normalize({id: name, [relationshipName]: entities}, 'pages', schema, firstSchema[name]))
      },
      concatRelated: (relationshipName, entities) => {
        if (entities instanceof Error) {
          return entityActions.get(name, entities)
        }
        return retypeAction(
          `${concatRelatedName(name)}_${actionifyName(name)}`,
          normalize({id: name, [relationshipName]: entities}, 'pages', schema, firstSchema[name],
          {
            relationships: {
              [name]: {
                [relationshipName]: {
                  concat: true
                }
              }
            }
          }))
      }
    }
  }
}

export function enableErschemaActions(erschemaReducer){
  return recompose(erschemaReducer, enableBatching, enableRetyping)
}