
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // Create writable stores for each data point
    const currentChoice = writable();
    const currency = writable();
    const currentYear = writable();
    const currentDay = writable();
    resetData();

    function resetData() {
      currentChoice.set({});
      currency.set({
        munten: 400,
        bomen: 30,
      });
      currentYear.set(1);
      currentDay.set(1);
    }

    /* src/components/ChoiceButton.svelte generated by Svelte v3.29.7 */
    const file = "src/components/ChoiceButton.svelte";

    function create_fragment(ctx) {
    	let div;
    	let p;
    	let t1;
    	let button;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = `${/*choiceEffect*/ ctx[1]}`;
    			t1 = space();
    			button = element("button");
    			t2 = text(/*choice*/ ctx[0]);
    			add_location(p, file, 39, 2, 759);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			attr_dev(button, "class", "svelte-1hba8fr");
    			add_location(button, file, 40, 2, 783);
    			attr_dev(div, "class", "choiceButton svelte-1hba8fr");
    			add_location(div, file, 38, 0, 730);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*makeChoice*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*choice*/ 1) set_data_dev(t2, /*choice*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $currentChoice;
    	let $currency;
    	validate_store(currentChoice, "currentChoice");
    	component_subscribe($$self, currentChoice, $$value => $$invalidate(3, $currentChoice = $$value));
    	validate_store(currency, "currency");
    	component_subscribe($$self, currency, $$value => $$invalidate(4, $currency = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ChoiceButton", slots, []);
    	let { choice } = $$props;
    	let choiceEffect = $currentChoice.choices[choice];

    	function makeChoice() {
    		// currency aanpassen
    		for (const effect of choiceEffect) {
    			set_store_value(currency, $currency[effect[0]] += effect[1], $currency);
    		}

    		// volgende dag
    		nextDay();
    	}

    	function nextDay() {
    		currentDay.update(value => value += 1);
    	}

    	const writable_props = ["choice"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ChoiceButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("choice" in $$props) $$invalidate(0, choice = $$props.choice);
    	};

    	$$self.$capture_state = () => ({
    		currentChoice,
    		currency,
    		currentYear,
    		currentDay,
    		choice,
    		choiceEffect,
    		makeChoice,
    		nextDay,
    		$currentChoice,
    		$currency
    	});

    	$$self.$inject_state = $$props => {
    		if ("choice" in $$props) $$invalidate(0, choice = $$props.choice);
    		if ("choiceEffect" in $$props) $$invalidate(1, choiceEffect = $$props.choiceEffect);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [choice, choiceEffect, makeChoice];
    }

    class ChoiceButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { choice: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ChoiceButton",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*choice*/ ctx[0] === undefined && !("choice" in props)) {
    			console.warn("<ChoiceButton> was created without expected prop 'choice'");
    		}
    	}

    	get choice() {
    		throw new Error("<ChoiceButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set choice(value) {
    		throw new Error("<ChoiceButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const choices = [
      {
        title: "Mollen in Eenwoud 1",
        description: "Er zijn mollen in de grond gevonden die de bomen storen. \nOm de mollen weg te halen, kost dat wel wat geld en tijd. Laat je ze weghalen of laat je ze zitten?",
        choices: {
          "Weghalen": [["munten", -50]],
          "Laten Zitten": [["bomen", -3]],
        }
      },
      {
        title: "Mollen in Eenwoud 2",
        description: "Er zijn mollen in de grond gevonden die de bomen storen. \nOm de mollen weg te halen, kost dat wel wat geld en tijd. Laat je ze weghalen of laat je ze zitten?",
        choices: {
          "Weghalen": [["munten", -50]],
          "Laten Zitten": [["bomen", -3]],
        }
      },
      {
        title: "Mollen in Eenwoud 3",
        description: "Er zijn mollen in de grond gevonden die de bomen storen. \nOm de mollen weg te halen, kost dat wel wat geld en tijd. Laat je ze weghalen of laat je ze zitten?",
        choices: {
          "Weghalen": [["munten", -50]],
          "Laten Zitten": [["bomen", -3]],
        }
      },
    ];

    /* src/components/Choices.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1 } = globals;
    const file$1 = "src/components/Choices.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (28:2) {#each Object.keys($currentChoice.choices) as choice}
    function create_each_block(ctx) {
    	let choicebutton;
    	let current;

    	choicebutton = new ChoiceButton({
    			props: { choice: /*choice*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(choicebutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(choicebutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const choicebutton_changes = {};
    			if (dirty & /*$currentChoice*/ 1) choicebutton_changes.choice = /*choice*/ ctx[2];
    			choicebutton.$set(choicebutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(choicebutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(choicebutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(choicebutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(28:2) {#each Object.keys($currentChoice.choices) as choice}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h1;
    	let t0_value = /*$currentChoice*/ ctx[0].title + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = /*$currentChoice*/ ctx[0].description + "";
    	let t2;
    	let t3;
    	let div;
    	let current;
    	let each_value = Object.keys(/*$currentChoice*/ ctx[0].choices);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$1, 24, 0, 514);
    			add_location(p, file$1, 25, 0, 546);
    			attr_dev(div, "class", "choices svelte-9w83o9");
    			add_location(div, file$1, 26, 0, 582);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$currentChoice*/ 1) && t0_value !== (t0_value = /*$currentChoice*/ ctx[0].title + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$currentChoice*/ 1) && t2_value !== (t2_value = /*$currentChoice*/ ctx[0].description + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*Object, $currentChoice*/ 1) {
    				each_value = Object.keys(/*$currentChoice*/ ctx[0].choices);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $currentChoice;
    	validate_store(currentChoice, "currentChoice");
    	component_subscribe($$self, currentChoice, $$value => $$invalidate(0, $currentChoice = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Choices", slots, []);

    	currentDay.subscribe(value => {
    		randomChoice();
    	});

    	function randomChoice() {
    		const randomIndex = Math.floor(Math.random() * choices.length);
    		currentChoice.set(choices[randomIndex]);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Choices> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ChoiceButton,
    		choices,
    		currentChoice,
    		currentDay,
    		randomChoice,
    		$currentChoice
    	});

    	return [$currentChoice];
    }

    class Choices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Choices",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/CollectionButton.svelte generated by Svelte v3.29.7 */

    const file$2 = "src/components/CollectionButton.svelte";

    function create_fragment$2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Collectie";
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			add_location(button, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CollectionButton", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CollectionButton> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CollectionButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CollectionButton",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Currency.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$1 } = globals;
    const file$3 = "src/components/Currency.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (12:2) {#each Object.keys($currency) as currencyItem}
    function create_each_block$1(ctx) {
    	let p;
    	let t0_value = /*currencyItem*/ ctx[1] + "";
    	let t0;
    	let t1;
    	let t2_value = /*$currency*/ ctx[0][/*currencyItem*/ ctx[1]] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(p, "class", "svelte-10zy88m");
    			add_location(p, file$3, 12, 2, 199);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$currency*/ 1 && t0_value !== (t0_value = /*currencyItem*/ ctx[1] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$currency*/ 1 && t2_value !== (t2_value = /*$currency*/ ctx[0][/*currencyItem*/ ctx[1]] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(12:2) {#each Object.keys($currency) as currencyItem}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let each_value = Object.keys(/*$currency*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "currency");
    			add_location(div, file$3, 10, 0, 125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$currency, Object*/ 1) {
    				each_value = Object.keys(/*$currency*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $currency;
    	validate_store(currency, "currency");
    	component_subscribe($$self, currency, $$value => $$invalidate(0, $currency = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Currency", slots, []);
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Currency> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ currency, $currency });
    	return [$currency];
    }

    class Currency extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Currency",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/YearCounter.svelte generated by Svelte v3.29.7 */
    const file$4 = "src/components/YearCounter.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let h2;
    	let t0;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text("Jaar: ");
    			t1 = text(/*$currentYear*/ ctx[0]);
    			t2 = space();
    			p = element("p");
    			t3 = text("Dag: ");
    			t4 = text(/*$currentDay*/ ctx[1]);
    			add_location(h2, file$4, 14, 2, 271);
    			add_location(p, file$4, 15, 2, 303);
    			attr_dev(div, "class", "currentMoment svelte-12pam2r");
    			add_location(div, file$4, 13, 0, 241);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(div, t2);
    			append_dev(div, p);
    			append_dev(p, t3);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$currentYear*/ 1) set_data_dev(t1, /*$currentYear*/ ctx[0]);
    			if (dirty & /*$currentDay*/ 2) set_data_dev(t4, /*$currentDay*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $currentYear;
    	let $currentDay;
    	validate_store(currentYear, "currentYear");
    	component_subscribe($$self, currentYear, $$value => $$invalidate(0, $currentYear = $$value));
    	validate_store(currentDay, "currentDay");
    	component_subscribe($$self, currentDay, $$value => $$invalidate(1, $currentDay = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("YearCounter", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<YearCounter> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		currentYear,
    		currentDay,
    		$currentYear,
    		$currentDay
    	});

    	return [$currentYear, $currentDay];
    }

    class YearCounter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "YearCounter",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.7 */
    const file$5 = "src/App.svelte";

    function create_fragment$5(ctx) {
    	let header;
    	let currency;
    	let t0;
    	let collectionbutton;
    	let t1;
    	let main;
    	let choices;
    	let t2;
    	let footer;
    	let yearcounter;
    	let current;
    	currency = new Currency({ $$inline: true });
    	collectionbutton = new CollectionButton({ $$inline: true });
    	choices = new Choices({ $$inline: true });
    	yearcounter = new YearCounter({ $$inline: true });

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(currency.$$.fragment);
    			t0 = space();
    			create_component(collectionbutton.$$.fragment);
    			t1 = space();
    			main = element("main");
    			create_component(choices.$$.fragment);
    			t2 = space();
    			footer = element("footer");
    			create_component(yearcounter.$$.fragment);
    			attr_dev(header, "class", "svelte-1xz13dt");
    			add_location(header, file$5, 16, 0, 382);
    			add_location(main, file$5, 20, 0, 437);
    			add_location(footer, file$5, 23, 0, 465);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(currency, header, null);
    			append_dev(header, t0);
    			mount_component(collectionbutton, header, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(choices, main, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, footer, anchor);
    			mount_component(yearcounter, footer, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(currency.$$.fragment, local);
    			transition_in(collectionbutton.$$.fragment, local);
    			transition_in(choices.$$.fragment, local);
    			transition_in(yearcounter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(currency.$$.fragment, local);
    			transition_out(collectionbutton.$$.fragment, local);
    			transition_out(choices.$$.fragment, local);
    			transition_out(yearcounter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(currency);
    			destroy_component(collectionbutton);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_component(choices);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(footer);
    			destroy_component(yearcounter);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Choices,
    		CollectionButton,
    		Currency,
    		YearCounter
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
