# erschema-actions

This is a utility action class to be used alongside the erschema-redux-immutable library

```
class erschemaActions {
  entities: {
    create: (ent: Object) => any,
    update: (ent: Object) => any,
    remove: (id: $$id) => any,
    get: (ent: Object) => any,
    index: (ents: Object[]) => any,
    getRelated: (id: $$id, relationshipName: string, ents: Object[]) => any,
    getAdditionalEntityProperties: (id: $$id, entityName: string, entity: Object) => any,
    concatRelated: (id: $$id, relationshipName: string, ents: Object[]) => any,
  }
}
```

It uses the standard erschema-redux-immutable entity actions, with the exception of get and index. get and index are variations of the normalize action that comes with erschema-redux-immutable, which means they take a nested object(s) and creates a series of entity index and relationship index actions to pass that information into the redux store. To keep these operations performant, the actions are wrapped in the redux-batched-actions library, so that they appear as a single transaction.