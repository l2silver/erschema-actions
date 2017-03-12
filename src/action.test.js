// @flow
jest.mock('redux-batched-actions', ()=>({batchActions: (action)=>action}))
jest.mock('redux-retype-actions', ()=>({retypeAction: (name, action)=>action}))
jest.mock('erschema-action-handlers', ()=>({
  entityActions: {
    index: (entityName, entities)=>({entityName, entities})
  },
  relationshipActions: {
    index: (entityName, relationships)=>({entityName, relationships})
  }
}))
import {Action} from './'
import {schemaMapper, standardizeEntity} from 'erschema'

const getId = ()=>Math.floor((Math.random()*100000))
describe('Action', function() {
  const schema = schemaMapper([
    standardizeEntity({
      name: 'users',
      properties: ['name', 'id'],
      relationships: [{name: 'friends'}],
    }),
    standardizeEntity({
      name: 'friends',
      properties: ['name', 'id']
    })
  ])
  class ActionWithSchema extends Action {
    constructor(name){
      super(schema, name)
    }
  }
  const action = new ActionWithSchema('users')
  describe('creates an action instance with access to', function(){
    it('get', function() {
      const entity = {id: 1, name: 'John'}
      expect(action.actions.get({...entity, friends: []})).toMatchSnapshot()
    })
  })
})