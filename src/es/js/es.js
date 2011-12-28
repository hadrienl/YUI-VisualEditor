/**
EditSurface namespace.

@submodule model-list
@since 3.4.0
**/

/**
Provides an API for managing an ordered list of Model instances.

In addition to providing convenient `add`, `create`, `reset`, and `remove`
methods for managing the models in the list, ModelLists are also bubble targets
for events on the model instances they contain. This means, for example, that
you can add several models to a list, and then subscribe to the `*:change` event
on the list to be notified whenever any model in the list changes.

ModelLists also maintain sort order efficiently as models are added and removed,
based on a custom `comparator` function you may define (if no comparator is
defined, models are sorted in insertion order).

@class ModelList
@extends Base
@uses ArrayList
@constructor
@since 3.4.0
**/

