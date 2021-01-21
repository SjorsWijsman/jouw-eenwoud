
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function empty() {
        return text('');
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/components/Icon.svelte generated by Svelte v3.29.7 */

    const file = "src/components/Icon.svelte";

    function create_fragment(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = `./resources/icons/${/*type*/ ctx[0]}.svg`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*type*/ ctx[0] + " icon"));
    			set_style(img, "height", /*size*/ ctx[1] + "rem");
    			set_style(img, "width", /*size*/ ctx[1] + "rem");
    			add_location(img, file, 5, 0, 60);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*type*/ 1 && img.src !== (img_src_value = `./resources/icons/${/*type*/ ctx[0]}.svg`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*type*/ 1 && img_alt_value !== (img_alt_value = "" + (/*type*/ ctx[0] + " icon"))) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*size*/ 2) {
    				set_style(img, "height", /*size*/ ctx[1] + "rem");
    			}

    			if (dirty & /*size*/ 2) {
    				set_style(img, "width", /*size*/ ctx[1] + "rem");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
    	let { type } = $$props;
    	let { size = 1.5 } = $$props;
    	const writable_props = ["type", "size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({ type, size });

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, size];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { type: 0, size: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*type*/ ctx[0] === undefined && !("type" in props)) {
    			console.warn("<Icon> was created without expected prop 'type'");
    		}
    	}

    	get type() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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

    // Create writable stores
    const user = writable({
      name: "Gebruiker",
      introduction: true,
    });
    const treeGrid = writable([]);
    const currency = writable({
      stappen: 12500,
      bomen: 0,
    });
    const currentYear = writable(35);
    const dialogue = writable(undefined);
    const selectedTile = writable(undefined);
    const tutorialStep = writable(1);
    const currentActivities = writable({});
    const activeActivity = writable();

    // Prevent negative currency values
    currency.subscribe(value => {
      for (const currency of Object.keys(value)) {
        if (value[currency] < 0) {
          value[currency] = 0;
        }
      }
      return value;
    });

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* src/components/Currency.svelte generated by Svelte v3.29.7 */
    const file$1 = "src/components/Currency.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let p;
    	let icon;
    	let t0;
    	let span;
    	let t1_value = Math.floor(/*$amount*/ ctx[2]).toLocaleString("NL-NL") + "";
    	let t1;
    	let current;

    	icon = new Icon({
    			props: { type: /*displayCurrency*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			create_component(icon.$$.fragment);
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "svelte-h1ov48");
    			add_location(span, file$1, 45, 4, 784);
    			attr_dev(p, "class", "svelte-h1ov48");
    			toggle_class(p, "negative", /*$amount*/ ctx[2] < 0);
    			toggle_class(p, "inverted", /*inverted*/ ctx[1]);
    			add_location(p, file$1, 43, 2, 697);
    			attr_dev(div, "class", "currency");
    			add_location(div, file$1, 42, 0, 672);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			mount_component(icon, p, null);
    			append_dev(p, t0);
    			append_dev(p, span);
    			append_dev(span, t1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const icon_changes = {};
    			if (dirty & /*displayCurrency*/ 1) icon_changes.type = /*displayCurrency*/ ctx[0];
    			icon.$set(icon_changes);
    			if ((!current || dirty & /*$amount*/ 4) && t1_value !== (t1_value = Math.floor(/*$amount*/ ctx[2]).toLocaleString("NL-NL") + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$amount*/ 4) {
    				toggle_class(p, "negative", /*$amount*/ ctx[2] < 0);
    			}

    			if (dirty & /*inverted*/ 2) {
    				toggle_class(p, "inverted", /*inverted*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
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
    	let $currency;
    	let $amount;
    	validate_store(currency, "currency");
    	component_subscribe($$self, currency, $$value => $$invalidate(4, $currency = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Currency", slots, []);
    	let { displayCurrency = "stappen" } = $$props;
    	let { inverted = false } = $$props;
    	const amount = tweened($currency[displayCurrency], { duration: 400, easing: cubicOut });
    	validate_store(amount, "amount");
    	component_subscribe($$self, amount, value => $$invalidate(2, $amount = value));

    	currency.subscribe(value => {
    		amount.set(value[displayCurrency]);
    	});

    	const writable_props = ["displayCurrency", "inverted"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Currency> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("displayCurrency" in $$props) $$invalidate(0, displayCurrency = $$props.displayCurrency);
    		if ("inverted" in $$props) $$invalidate(1, inverted = $$props.inverted);
    	};

    	$$self.$capture_state = () => ({
    		Icon,
    		currency,
    		tweened,
    		cubicOut,
    		displayCurrency,
    		inverted,
    		amount,
    		$currency,
    		$amount
    	});

    	$$self.$inject_state = $$props => {
    		if ("displayCurrency" in $$props) $$invalidate(0, displayCurrency = $$props.displayCurrency);
    		if ("inverted" in $$props) $$invalidate(1, inverted = $$props.inverted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [displayCurrency, inverted, $amount, amount];
    }

    class Currency extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { displayCurrency: 0, inverted: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Currency",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get displayCurrency() {
    		throw new Error("<Currency>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set displayCurrency(value) {
    		throw new Error("<Currency>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inverted() {
    		throw new Error("<Currency>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inverted(value) {
    		throw new Error("<Currency>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/YearCounter.svelte generated by Svelte v3.29.7 */
    const file$2 = "src/components/YearCounter.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let span;
    	let t1;
    	let h2;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Huidig Jaar:";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(/*$currentYear*/ ctx[0]);
    			add_location(span, file$2, 21, 2, 321);
    			attr_dev(h2, "class", "svelte-1te31pj");
    			add_location(h2, file$2, 22, 2, 349);
    			attr_dev(div, "class", "currentMoment svelte-1te31pj");
    			add_location(div, file$2, 20, 0, 291);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$currentYear*/ 1) set_data_dev(t2, /*$currentYear*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let $currentYear;
    	validate_store(currentYear, "currentYear");
    	component_subscribe($$self, currentYear, $$value => $$invalidate(0, $currentYear = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("YearCounter", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<YearCounter> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ currentYear, $currentYear });
    	return [$currentYear];
    }

    class YearCounter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "YearCounter",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const groundTypes = [{
        type: "gras",
        growModifier: 1,
      },
      {
        type: "water",
        growModifier: 0,
      },
      {
        type: "zand",
        growModifier: 0.3,
      },
    ];

    const treeTypes = [
      "eik", "den", "berk",
    ];

    const stepsPerDay = 2000;

    const treeStages = {
      0: 1,
      7: 2,
      30: 3,
    };

    const randomNames = [
      "Suze", "Naomi", "Frank", "Didier", "Nadine", "Soraya", "Femke", "Maaike", "Anthony", "Sara", "Jan-Jaap", "Laurens", "Roos", "Sjors", "Veerle", "Victor"
    ];

    /* src/components/Tree.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/components/Tree.svelte";

    // (197:2) {#if tileInfo.tree}
    function create_if_block_1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = `resources/${/*tileInfo*/ ctx[0].tree.type}-${/*treeStage*/ ctx[2]}.svg`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "boom");
    			attr_dev(img, "class", "tree svelte-190fpel");
    			set_style(img, "top", /*tileInfo*/ ctx[0].tree.yOffset + "%");
    			set_style(img, "left", /*tileInfo*/ ctx[0].tree.xOffset + "%");
    			set_style(img, "filter", "saturate(" + /*saturation*/ ctx[3] + ")");
    			add_location(img, file$3, 197, 4, 5043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tileInfo, treeStage*/ 5 && img.src !== (img_src_value = `resources/${/*tileInfo*/ ctx[0].tree.type}-${/*treeStage*/ ctx[2]}.svg`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*tileInfo*/ 1) {
    				set_style(img, "top", /*tileInfo*/ ctx[0].tree.yOffset + "%");
    			}

    			if (dirty & /*tileInfo*/ 1) {
    				set_style(img, "left", /*tileInfo*/ ctx[0].tree.xOffset + "%");
    			}

    			if (dirty & /*saturation*/ 8) {
    				set_style(img, "filter", "saturate(" + /*saturation*/ ctx[3] + ")");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(197:2) {#if tileInfo.tree}",
    		ctx
    	});

    	return block;
    }

    // (204:2) {#if activity}
    function create_if_block(ctx) {
    	let button;
    	let button_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			attr_dev(button, "class", "activity-button svelte-190fpel");
    			add_location(button, file$3, 204, 4, 5285);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { y: 100, duration: 800 }, true);
    				button_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { y: 100, duration: 800 }, false);
    			button_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_transition) button_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(204:2) {#if activity}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t;
    	let current;
    	let if_block0 = /*tileInfo*/ ctx[0].tree && create_if_block_1(ctx);
    	let if_block1 = /*activity*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "tree-tile svelte-190fpel");
    			toggle_class(div, "grass", /*tileInfo*/ ctx[0].ground.type === "gras");
    			toggle_class(div, "sand", /*tileInfo*/ ctx[0].ground.type === "zand");
    			toggle_class(div, "water", /*tileInfo*/ ctx[0].ground.type === "water");
    			toggle_class(div, "highlight", /*tileInfo*/ ctx[0].tree && /*tileInfo*/ ctx[0].tree.owner === /*$user*/ ctx[4].name);
    			toggle_class(div, "activity", /*activity*/ ctx[1]);
    			add_location(div, file$3, 190, 0, 4752);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*tileInfo*/ ctx[0].tree) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*activity*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*activity*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*tileInfo*/ 1) {
    				toggle_class(div, "grass", /*tileInfo*/ ctx[0].ground.type === "gras");
    			}

    			if (dirty & /*tileInfo*/ 1) {
    				toggle_class(div, "sand", /*tileInfo*/ ctx[0].ground.type === "zand");
    			}

    			if (dirty & /*tileInfo*/ 1) {
    				toggle_class(div, "water", /*tileInfo*/ ctx[0].ground.type === "water");
    			}

    			if (dirty & /*tileInfo, $user*/ 17) {
    				toggle_class(div, "highlight", /*tileInfo*/ ctx[0].tree && /*tileInfo*/ ctx[0].tree.owner === /*$user*/ ctx[4].name);
    			}

    			if (dirty & /*activity*/ 2) {
    				toggle_class(div, "activity", /*activity*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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

    function scaleValue(value, from, to) {
    	var scale = (to[1] - to[0]) / (from[1] - from[0]);
    	var capped = Math.min(from[1], Math.max(from[0], value)) - from[0];
    	return capped * scale + to[0];
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $user;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(4, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tree", slots, []);
    	let { tileInfo } = $$props;
    	let { activity = false } = $$props;
    	let treeStage = 1;
    	let saturation = 1;
    	const writable_props = ["tileInfo", "activity"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tree> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		dialogue.set("activity");
    		activeActivity.set(tileInfo.index);
    	};

    	$$self.$$set = $$props => {
    		if ("tileInfo" in $$props) $$invalidate(0, tileInfo = $$props.tileInfo);
    		if ("activity" in $$props) $$invalidate(1, activity = $$props.activity);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		treeStages,
    		user,
    		dialogue,
    		activeActivity,
    		tileInfo,
    		activity,
    		treeStage,
    		saturation,
    		scaleValue,
    		$user
    	});

    	$$self.$inject_state = $$props => {
    		if ("tileInfo" in $$props) $$invalidate(0, tileInfo = $$props.tileInfo);
    		if ("activity" in $$props) $$invalidate(1, activity = $$props.activity);
    		if ("treeStage" in $$props) $$invalidate(2, treeStage = $$props.treeStage);
    		if ("saturation" in $$props) $$invalidate(3, saturation = $$props.saturation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*tileInfo*/ 1) {
    			 if (tileInfo.tree) {
    				for (const stage of Object.keys(treeStages)) {
    					if (tileInfo.tree.age >= stage) {
    						$$invalidate(2, treeStage = treeStages[stage]);
    					} else {
    						break;
    					}
    				}

    				if (tileInfo.tree.health > 0) {
    					$$invalidate(3, saturation = scaleValue(tileInfo.tree.health, [0, tileInfo.tree.maxHealth], [0.85, 1.1]));
    				}
    			}
    		}
    	};

    	return [tileInfo, activity, treeStage, saturation, $user, click_handler];
    }

    class Tree extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { tileInfo: 0, activity: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tree",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tileInfo*/ ctx[0] === undefined && !("tileInfo" in props)) {
    			console.warn("<Tree> was created without expected prop 'tileInfo'");
    		}
    	}

    	get tileInfo() {
    		throw new Error("<Tree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tileInfo(value) {
    		throw new Error("<Tree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activity() {
    		throw new Error("<Tree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activity(value) {
    		throw new Error("<Tree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const activitiesList = [{
        text: "Bij een paar bomen zie je berkenzwammen, ze zijn erg mooi maar wat zal dit betekenen voor de bomen?",
        type: "Quiz-vraag",
        choices: {
          "Houtrot": {
            correct: true,
            resultText: "Het is inderdaad houtrot, helaas kun je dit niet bestrijden. Je ontvangt stappen voor het correcte antwoord!"
          },
          "Bacteriën": {
            correct: false,
            resultText: "Helaas, er komen geen bacteriën. Berkenzwammen veroorzaken houtrot. Je hebt jammer genoeg geen stappen verdiend."
          },
        }
      },
      {
        text: "Bossen worden wel eens de groene longen van onze aarde genoemd. Waarom is dat?",
        type: "Quiz-vraag",
        choices: {
          "Omdat ze overdag koolstofdioxide (CO2) opslaan en zuurstof afgeven.": {
            correct: true,
            resultText: "Wauw, je ontvangt stappen omdat je het goeie antwoord hebt gegeven! Ga zo door. "
          },
          "Omdat ze 's nachts koolstofdioxide (CO2) opslaan en zuurstof afgeven.": {
            correct: false,
            resultText: "Jammer, bossen slaan overdag koolstofdioxide (CO2) op en geven zuurstof af; niet 's nachts. Je krijgt geen stappen."
          },
          "Omdat ze op satellietbeelden de vorm van longen hebben.": {
            correct: false,
            resultText: "Ohjee, nee bossen worden wel eens de groene longen van onze aarde genoemd omdat ze overdag koolstofdioxide (CO2) opslaan en zuurstof afgeven. Je ontvangt helaas geen stappen. "
          },
          "Omdat bossen zwaveldioxide filteren.": {
            correct: false,
            resultText: "Helaas het antwoord is niet goed. Het antwoord moest zijn dat bossen over koolstofdioxide (CO2) opslaan en zuurstof afgeven. Volgende keer beter!"
          },
        }
      },
      {
        text: "Iedereen heeft een stukje van de Aarde nodig om te leven. Bijvoorbeeld om voedsel te verbouwen, je huis te verwarmen, afval te laten verwerken, kleding te produceren of naar je werk te reizen. Per persoon hebben we op Aarde ongeveer 2,5 voetbalvelden beschikbaar. Hoeveel gebruikt de gemiddelde Nederlander?",
        type: "Quiz-vraag",
        choices: {
          "1 voetbalveld": {
            correct: false,
            resultText: "Jammer het is geen 1 voetbalveld, maar 8x zoveel!"
          },
          "4 voetbalvelden": {
            correct: false,
            resultText: "Helaas, een gemiddelde Nederlander gebruikt 8 voetbalvelden. Dat is 2x zoveel!"
          },
          "8 voetbalvelden": {
            correct: true,
            resultText: "Klopt! Een gemiddelde Nederlander verbruikt 8 voetbalvelden, veel hè? Je ontvangt stappen omdat je het goeie antwoord hebt."
          },
          "10 voetbalvelden": {
            correct: false,
            resultText: "Ah nee, een gemiddelde Nederlander verbruikt 8 voetbalvelden. Jammer, volgende keer beter!"
          },
        }
      },
      {
        text: "Waarmee kun je de meeste CO2 uitstoot besparen?",
        type: "Quiz-vraag",
        choices: {
          "Je huis zuinig verwarmen.": {
            correct: true,
            resultText: "Het klinkt alsof je bewust bent van je eigen gedrag op het milieu, complimenten! Je verdient extra stappen!"
          },
          "Maximaal 5 min. douchen.": {
            correct: false,
            resultText: "Helaas, het beste is om je huis zuinig te verwamren."
          },
          "Geen wasdroger of vaatwasser gebruiken.": {
            correct: false,
            resultText: "Wat jammer, het goede antwoord is je huis zuinig verwarmen."
          },
          "Lichten en stopcontacten niet gebruiken wanneer de kamer niet wordt gebruikt.": {
            correct: false,
            resultText: "Helaas, dit zou kunnen helpen op je energierekening, maar om de CO2 uitstoot besparen is om je huis zuinig te verwarmen."
          },
        }
      },
    ];

    /* src/components/Simulation.svelte generated by Svelte v3.29.7 */

    function create_fragment$4(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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
    	let $user;
    	let $currentYear;
    	let $treeGrid;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(0, $user = $$value));
    	validate_store(currentYear, "currentYear");
    	component_subscribe($$self, currentYear, $$value => $$invalidate(1, $currentYear = $$value));
    	validate_store(treeGrid, "treeGrid");
    	component_subscribe($$self, treeGrid, $$value => $$invalidate(2, $treeGrid = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Simulation", slots, []);
    	treeGrid.update(grid => randomlyPlantTrees(grid));

    	function randomlyPlantTrees(grid) {
    		for (const tile of grid) {
    			const hasATree = Math.random() < 0.6;

    			if (hasATree && tile.ground.growModifier > 0) {
    				const maxHealth = stepsPerDay * (1 + (1 - tile.ground.growModifier)) * 5;

    				tile.tree = {
    					type: treeTypes[Math.floor(Math.random() * treeTypes.length)],
    					age: Math.floor(Math.random() * 35) - 1,
    					xOffset: Math.floor(Math.random() * 26) - 12.5,
    					yOffset: Math.floor(Math.random() * 26) - 12.5,
    					owner: randomNames[Math.floor(Math.random() * randomNames.length)],
    					maxHealth,
    					health: Math.floor(Math.random() * maxHealth + 1)
    				};
    			}
    		}

    		return grid;
    	}

    	currentYear.subscribe(() => {
    		// Age trees & reduce health on year pass
    		treeGrid.update(value => {
    			for (const tile of value) {
    				if (tile.tree) {
    					tile.tree.age += 1;

    					if (tile.tree.owner === $user.name) {
    						tile.tree.health -= stepsPerDay * (1 + (1 - tile.ground.growModifier));

    						if (tile.tree.health <= 0) {
    							currency.update(value => {
    								value.bomen -= 1;
    								return value;
    							});

    							delete tile.tree;
    						}
    					}
    				}
    			}

    			return value;
    		});

    		// Place random activity on a tree every year
    		currentActivities.update(value => {
    			value = {};

    			if ($currentYear !== 35) {
    				for (let i = 0; i < 999; i++) {
    					const randomTile = Math.floor(Math.random() * $treeGrid.length);

    					if ($treeGrid[randomTile].tree) {
    						value[randomTile] = {
    							activity: Math.floor(Math.random() * activitiesList.length),
    							reward: ["stappen", Math.floor(Math.random() * 300) + 200]
    						};

    						break;
    					}
    				}
    			}

    			return value;
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Simulation> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		treeTypes,
    		stepsPerDay,
    		randomNames,
    		treeGrid,
    		currentYear,
    		user,
    		currency,
    		currentActivities,
    		activitiesList,
    		randomlyPlantTrees,
    		$user,
    		$currentYear,
    		$treeGrid
    	});

    	return [];
    }

    class Simulation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Simulation",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    // https://www.kirupa.com/html5/drag.htm
    function draggable() {
      var dragItem = document.querySelector("#dragItem");
      var container = document.querySelector("#container");

      var active = false;
      var currentX;
      var currentY;
      var initialX;
      var initialY;
      var xOffset = 0;
      var yOffset = 0;

      container.addEventListener("touchstart", dragStart, false);
      container.addEventListener("touchend", dragEnd, false);
      container.addEventListener("touchmove", drag, false);

      container.addEventListener("mousedown", dragStart, false);
      container.addEventListener("mouseup", dragEnd, false);
      container.addEventListener("mousemove", drag, false);

      function dragStart(e) {
        if (e.type === "touchstart") {
          initialX = e.touches[0].clientX - xOffset;
          initialY = e.touches[0].clientY - yOffset;
        } else {
          initialX = e.clientX - xOffset;
          initialY = e.clientY - yOffset;
        }

        if (e.target.classList.contains("tree-tile")) {
          active = true;
        }
      }

      function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;

        active = false;
      }

      function drag(e) {
        if (active) {

          e.preventDefault();

          if (e.type === "touchmove") {
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
          } else {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
          }

          xOffset = currentX;
          yOffset = currentY;

          setTranslate(currentX, currentY, dragItem);
        }
      }

      function setTranslate(xPos, yPos, el) {
        if (el) {
          el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        }
      }
    }

    /* src/components/TreeGrid.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$1 } = globals;
    const file$4 = "src/components/TreeGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (121:10) {#if selected === i}
    function create_if_block$1(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let current_block_type_index_1;
    	let if_block1;
    	let div_transition;
    	let current;
    	const if_block_creators = [create_if_block_3, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tile*/ ctx[7].tree) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block_1$1, create_if_block_2];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*tile*/ ctx[7].tree) return 0;
    		if (/*tile*/ ctx[7].ground.growModifier > 0) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index_1 = select_block_type_1(ctx))) {
    		if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "info-container svelte-1yp15iv");
    			add_location(div, file$4, 121, 12, 2628);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t);

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div, t);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if (~current_block_type_index_1) {
    					if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    						if_blocks_1[previous_block_index_1] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_1) {
    					if_block1 = if_blocks_1[current_block_type_index_1];

    					if (!if_block1) {
    						if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				} else {
    					if_block1 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 300 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 300 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].d();
    			}

    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(121:10) {#if selected === i}",
    		ctx
    	});

    	return block;
    }

    // (128:14) {:else}
    function create_else_block(ctx) {
    	let div;
    	let h3;
    	let t0_value = /*tile*/ ctx[7].ground.type + "";
    	let t0;
    	let t1;
    	let span;
    	let t2_value = /*tile*/ ctx[7].ground.growModifier * 100 + "";
    	let t2;
    	let t3;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = text("%");
    			attr_dev(h3, "class", "svelte-1yp15iv");
    			add_location(h3, file$4, 129, 18, 3052);
    			add_location(span, file$4, 130, 18, 3098);
    			attr_dev(div, "class", "info-tile svelte-1yp15iv");
    			add_location(div, file$4, 128, 16, 2967);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(div, t1);
    			append_dev(div, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$treeGrid*/ 2) && t0_value !== (t0_value = /*tile*/ ctx[7].ground.type + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$treeGrid*/ 2) && t2_value !== (t2_value = /*tile*/ ctx[7].ground.growModifier * 100 + "")) set_data_dev(t2, t2_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 100, duration: 300 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 100, duration: 300 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(128:14) {:else}",
    		ctx
    	});

    	return block;
    }

    // (123:14) {#if tile.tree}
    function create_if_block_3(ctx) {
    	let div;
    	let h3;
    	let t0_value = /*tile*/ ctx[7].tree.type + "";
    	let t0;
    	let t1;
    	let span;
    	let t2_value = /*tile*/ ctx[7].tree.age + "";
    	let t2;
    	let t3;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = text(" jaar oud");
    			attr_dev(h3, "class", "svelte-1yp15iv");
    			add_location(h3, file$4, 124, 18, 2824);
    			add_location(span, file$4, 125, 18, 2868);
    			attr_dev(div, "class", "info-tile svelte-1yp15iv");
    			add_location(div, file$4, 123, 16, 2739);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(div, t1);
    			append_dev(div, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$treeGrid*/ 2) && t0_value !== (t0_value = /*tile*/ ctx[7].tree.type + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$treeGrid*/ 2) && t2_value !== (t2_value = /*tile*/ ctx[7].tree.age + "")) set_data_dev(t2, t2_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 100, duration: 300 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 100, duration: 300 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(123:14) {#if tile.tree}",
    		ctx
    	});

    	return block;
    }

    // (140:53)
    function create_if_block_2(ctx) {
    	let button;
    	let button_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Plant boom";
    			attr_dev(button, "class", "tile-button green svelte-1yp15iv");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			add_location(button, file$4, 140, 16, 3542);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { x: -100, duration: 300 }, true);
    				button_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { x: -100, duration: 300 }, false);
    			button_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_transition) button_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(140:53) ",
    		ctx
    	});

    	return block;
    }

    // (134:14) {#if tile.tree}
    function create_if_block_1$1(ctx) {
    	let button;
    	let button_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Bekijk boom";
    			attr_dev(button, "class", "tile-button svelte-1yp15iv");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			add_location(button, file$4, 134, 16, 3234);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { x: -100, duration: 300 }, true);
    				button_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!button_transition) button_transition = create_bidirectional_transition(button, fly, { x: -100, duration: 300 }, false);
    			button_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_transition) button_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(134:14) {#if tile.tree}",
    		ctx
    	});

    	return block;
    }

    // (116:6) {#each $treeGrid as tile, i}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let tree;
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;

    	tree = new Tree({
    			props: {
    				tileInfo: /*tile*/ ctx[7],
    				activity: Object.keys(/*$currentActivities*/ ctx[2]).includes(/*i*/ ctx[9].toString())
    			},
    			$$inline: true
    		});

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*i*/ ctx[9]);
    	}

    	let if_block = /*selected*/ ctx[0] === /*i*/ ctx[9] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(tree.$$.fragment);
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			add_location(div0, file$4, 117, 10, 2392);
    			attr_dev(div1, "class", "tile-container svelte-1yp15iv");
    			set_style(div1, "z-index", /*i*/ ctx[9]);
    			toggle_class(div1, "selected", /*selected*/ ctx[0] === /*i*/ ctx[9]);
    			add_location(div1, file$4, 116, 8, 2297);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(tree, div0, null);
    			append_dev(div1, t0);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const tree_changes = {};
    			if (dirty & /*$treeGrid*/ 2) tree_changes.tileInfo = /*tile*/ ctx[7];
    			if (dirty & /*$currentActivities*/ 4) tree_changes.activity = Object.keys(/*$currentActivities*/ ctx[2]).includes(/*i*/ ctx[9].toString());
    			tree.$set(tree_changes);

    			if (/*selected*/ ctx[0] === /*i*/ ctx[9]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*selected*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, t1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*selected*/ 1) {
    				toggle_class(div1, "selected", /*selected*/ ctx[0] === /*i*/ ctx[9]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tree.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tree.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(tree);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(116:6) {#each $treeGrid as tile, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let simulation;
    	let t;
    	let div2;
    	let div1;
    	let div0;
    	let div2_transition;
    	let current;
    	simulation = new Simulation({ $$inline: true });
    	let each_value = /*$treeGrid*/ ctx[1];
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
    			create_component(simulation.$$.fragment);
    			t = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "tree-grid svelte-1yp15iv");
    			set_style(div0, "grid-template-columns", "repeat(" + gridSize + ",5rem)");
    			set_style(div0, "grid-template-rows", "repeat(" + gridSize + ",5rem)");
    			add_location(div0, file$4, 112, 4, 2116);
    			attr_dev(div1, "id", "dragItem");
    			attr_dev(div1, "class", "svelte-1yp15iv");
    			toggle_class(div1, "selected-container", /*selected*/ ctx[0] !== false);
    			add_location(div1, file$4, 111, 2, 2044);
    			attr_dev(div2, "id", "container");
    			attr_dev(div2, "class", "svelte-1yp15iv");
    			add_location(div2, file$4, 110, 0, 1976);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(simulation, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected, dialogue, $treeGrid, Object, $currentActivities*/ 7) {
    				each_value = /*$treeGrid*/ ctx[1];
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
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*selected*/ 1) {
    				toggle_class(div1, "selected-container", /*selected*/ ctx[0] !== false);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(simulation.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { y: 100, duration: 800 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(simulation.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { y: 100, duration: 800 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(simulation, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div2_transition) div2_transition.end();
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

    const gridSize = 10;

    function instance$5($$self, $$props, $$invalidate) {
    	let $treeGrid;
    	let $currentActivities;
    	validate_store(treeGrid, "treeGrid");
    	component_subscribe($$self, treeGrid, $$value => $$invalidate(1, $treeGrid = $$value));
    	validate_store(currentActivities, "currentActivities");
    	component_subscribe($$self, currentActivities, $$value => $$invalidate(2, $currentActivities = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TreeGrid", slots, []);

    	onMount(async () => {
    		draggable();
    	});

    	// Create grid according to grid size with random groundtypes
    	treeGrid.set(createGrid());

    	function createGrid() {
    		const grid = [];

    		for (var i = 0; i < gridSize * gridSize; i++) {
    			const groundType = groundTypes[Math.floor(Math.random() * groundTypes.length)];
    			grid.push({ index: i, ground: groundType });
    		}

    		return grid;
    	}

    	let selected = false;
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TreeGrid> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => selected === i
    	? $$invalidate(0, selected = false)
    	: $$invalidate(0, selected = i);

    	const click_handler_1 = () => dialogue.set("treeDetails");
    	const click_handler_2 = () => dialogue.set("plantTree");

    	$$self.$capture_state = () => ({
    		Tree,
    		Simulation,
    		onMount,
    		fade,
    		fly,
    		groundTypes,
    		treeGrid,
    		dialogue,
    		selectedTile,
    		currentActivities,
    		draggable,
    		gridSize,
    		createGrid,
    		selected,
    		$treeGrid,
    		$currentActivities
    	});

    	$$self.$inject_state = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selected*/ 1) {
    			// Set selected tile value to selectedTile store
    			 if (selected !== false) selectedTile.set(selected);
    		}
    	};

    	return [
    		selected,
    		$treeGrid,
    		$currentActivities,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class TreeGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TreeGrid",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Health.svelte generated by Svelte v3.29.7 */
    const file$5 = "src/components/Health.svelte";

    function create_fragment$6(ctx) {
    	let progress_1;

    	const block = {
    		c: function create() {
    			progress_1 = element("progress");
    			progress_1.value = /*$progress*/ ctx[1];
    			attr_dev(progress_1, "max", /*maxHealth*/ ctx[0]);
    			attr_dev(progress_1, "class", "svelte-mwiwpn");
    			add_location(progress_1, file$5, 38, 0, 772);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, progress_1, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$progress*/ 2) {
    				prop_dev(progress_1, "value", /*$progress*/ ctx[1]);
    			}

    			if (dirty & /*maxHealth*/ 1) {
    				attr_dev(progress_1, "max", /*maxHealth*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(progress_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $progress;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Health", slots, []);
    	let { health } = $$props;
    	let { maxHealth } = $$props;
    	const progress = tweened(0, { duration: 800, easing: cubicOut });
    	validate_store(progress, "progress");
    	component_subscribe($$self, progress, value => $$invalidate(1, $progress = value));
    	const writable_props = ["health", "maxHealth"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Health> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("health" in $$props) $$invalidate(3, health = $$props.health);
    		if ("maxHealth" in $$props) $$invalidate(0, maxHealth = $$props.maxHealth);
    	};

    	$$self.$capture_state = () => ({
    		tweened,
    		cubicOut,
    		health,
    		maxHealth,
    		progress,
    		$progress
    	});

    	$$self.$inject_state = $$props => {
    		if ("health" in $$props) $$invalidate(3, health = $$props.health);
    		if ("maxHealth" in $$props) $$invalidate(0, maxHealth = $$props.maxHealth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*health*/ 8) {
    			 progress.set(health);
    		}
    	};

    	return [maxHealth, $progress, progress, health];
    }

    class Health extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { health: 3, maxHealth: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Health",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*health*/ ctx[3] === undefined && !("health" in props)) {
    			console.warn("<Health> was created without expected prop 'health'");
    		}

    		if (/*maxHealth*/ ctx[0] === undefined && !("maxHealth" in props)) {
    			console.warn("<Health> was created without expected prop 'maxHealth'");
    		}
    	}

    	get health() {
    		throw new Error("<Health>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set health(value) {
    		throw new Error("<Health>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxHealth() {
    		throw new Error("<Health>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxHealth(value) {
    		throw new Error("<Health>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TreeDetails.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$2 } = globals;

    const file$6 = "src/components/TreeDetails.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (176:0) {#if $treeGrid[$selectedTile].tree}
    function create_if_block$2(ctx) {
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let div0;
    	let current;
    	const if_block_creators = [create_if_block_1$2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*showTreeInfo*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let each_value = Array(/*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.age + 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if_block.c();
    			t = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "tree-rings svelte-1ebxhfi");
    			set_style(div0, "transform", "rotate(" + Math.floor(Math.random() * 361) + "deg)");
    			add_location(div0, file$6, 223, 2, 4971);
    			attr_dev(div1, "class", "container svelte-1ebxhfi");
    			add_location(div1, file$6, 176, 0, 3051);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div1, t);
    			}

    			if (dirty & /*$treeGrid, $selectedTile*/ 48) {
    				const old_length = each_value.length;
    				each_value = Array(/*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.age + 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = old_length; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (!each_blocks[i]) {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (i = each_value.length; i < old_length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(176:0) {#if $treeGrid[$selectedTile].tree}",
    		ctx
    	});

    	return block;
    }

    // (215:2) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let button;
    	let icon;
    	let t0;
    	let t1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let current;
    	let mounted;
    	let dispose;
    	icon = new Icon({ props: { type: "bomen" }, $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			create_component(icon.$$.fragment);
    			t0 = text("\n        Sluiten");
    			t1 = space();
    			img = element("img");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			attr_dev(button, "class", "tree-info-button capitalize green svelte-1ebxhfi");
    			add_location(button, file$6, 216, 6, 4624);
    			if (img.src !== (img_src_value = "./resources/info/info-" + /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.type + ".svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.type + " info"));
    			attr_dev(img, "class", "info-img svelte-1ebxhfi");
    			add_location(img, file$6, 220, 6, 4810);
    			attr_dev(div, "class", "sub-container svelte-1ebxhfi");
    			add_location(div, file$6, 215, 4, 4590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			mount_component(icon, button, null);
    			append_dev(button, t0);
    			append_dev(div, t1);
    			append_dev(div, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$treeGrid, $selectedTile*/ 48 && img.src !== (img_src_value = "./resources/info/info-" + /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.type + ".svg")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*$treeGrid, $selectedTile*/ 48 && img_alt_value !== (img_alt_value = "" + (/*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.type + " info"))) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(215:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (178:2) {#if !showTreeInfo}
    function create_if_block_1$2(ctx) {
    	let div2;
    	let header;
    	let t0;
    	let button;
    	let icon0;
    	let t1;
    	let t2_value = /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.type + "";
    	let t2;
    	let t3;
    	let div0;
    	let tree;
    	let t4;
    	let div1;
    	let span1;
    	let span0;
    	let t5_value = /*treeHealth*/ ctx[1].toLocaleString("NL-NL") + "";
    	let t5;
    	let t6;
    	let t7_value = /*maxTreeHealth*/ ctx[2].toLocaleString("NL-NL") + "";
    	let t7;
    	let t8;
    	let icon1;
    	let t9;
    	let health;
    	let t10;
    	let t11;
    	let footer;
    	let p;
    	let t12_value = /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.age + "";
    	let t12;
    	let t13;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.owner === /*$user*/ ctx[6].name) return create_if_block_3$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);
    	icon0 = new Icon({ props: { type: "bomen" }, $$inline: true });

    	tree = new Tree({
    			props: {
    				tileInfo: /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]],
    				activity: Object.keys(/*$currentActivities*/ ctx[7]).includes(/*$selectedTile*/ ctx[5].toString())
    			},
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { type: "stappen" },
    			$$inline: true
    		});

    	health = new Health({
    			props: {
    				health: /*treeHealth*/ ctx[1],
    				maxHealth: /*maxTreeHealth*/ ctx[2]
    			},
    			$$inline: true
    		});

    	let if_block1 = /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.owner === /*$user*/ ctx[6].name && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			header = element("header");
    			if_block0.c();
    			t0 = space();
    			button = element("button");
    			create_component(icon0.$$.fragment);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			div0 = element("div");
    			create_component(tree.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span0 = element("span");
    			t5 = text(t5_value);
    			t6 = text("/");
    			t7 = text(t7_value);
    			t8 = space();
    			create_component(icon1.$$.fragment);
    			t9 = space();
    			create_component(health.$$.fragment);
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			footer = element("footer");
    			p = element("p");
    			t12 = text(t12_value);
    			t13 = text(" jaar oud");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			attr_dev(button, "class", "tree-info-button capitalize green svelte-1ebxhfi");
    			add_location(button, file$6, 185, 8, 3340);
    			attr_dev(header, "class", "svelte-1ebxhfi");
    			add_location(header, file$6, 179, 6, 3135);
    			attr_dev(div0, "class", "tree-container svelte-1ebxhfi");
    			add_location(div0, file$6, 190, 6, 3576);
    			attr_dev(span0, "class", "current-health svelte-1ebxhfi");
    			add_location(span0, file$6, 195, 10, 3810);
    			attr_dev(span1, "class", "svelte-1ebxhfi");
    			add_location(span1, file$6, 194, 8, 3793);
    			attr_dev(div1, "class", "health-container svelte-1ebxhfi");
    			add_location(div1, file$6, 193, 6, 3754);
    			attr_dev(p, "class", "svelte-1ebxhfi");
    			add_location(p, file$6, 211, 8, 4497);
    			attr_dev(footer, "class", "svelte-1ebxhfi");
    			add_location(footer, file$6, 210, 6, 4480);
    			attr_dev(div2, "class", "sub-container svelte-1ebxhfi");
    			add_location(div2, file$6, 178, 4, 3101);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, header);
    			if_block0.m(header, null);
    			append_dev(header, t0);
    			append_dev(header, button);
    			mount_component(icon0, button, null);
    			append_dev(button, t1);
    			append_dev(button, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div0);
    			mount_component(tree, div0, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, span1);
    			append_dev(span1, span0);
    			append_dev(span0, t5);
    			append_dev(span1, t6);
    			append_dev(span1, t7);
    			append_dev(span1, t8);
    			mount_component(icon1, span1, null);
    			append_dev(div1, t9);
    			mount_component(health, div1, null);
    			append_dev(div2, t10);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div2, t11);
    			append_dev(div2, footer);
    			append_dev(footer, p);
    			append_dev(p, t12);
    			append_dev(p, t13);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(header, t0);
    				}
    			}

    			if ((!current || dirty & /*$treeGrid, $selectedTile*/ 48) && t2_value !== (t2_value = /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.type + "")) set_data_dev(t2, t2_value);
    			const tree_changes = {};
    			if (dirty & /*$treeGrid, $selectedTile*/ 48) tree_changes.tileInfo = /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]];
    			if (dirty & /*$currentActivities, $selectedTile*/ 160) tree_changes.activity = Object.keys(/*$currentActivities*/ ctx[7]).includes(/*$selectedTile*/ ctx[5].toString());
    			tree.$set(tree_changes);
    			if ((!current || dirty & /*treeHealth*/ 2) && t5_value !== (t5_value = /*treeHealth*/ ctx[1].toLocaleString("NL-NL") + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*maxTreeHealth*/ 4) && t7_value !== (t7_value = /*maxTreeHealth*/ ctx[2].toLocaleString("NL-NL") + "")) set_data_dev(t7, t7_value);
    			const health_changes = {};
    			if (dirty & /*treeHealth*/ 2) health_changes.health = /*treeHealth*/ ctx[1];
    			if (dirty & /*maxTreeHealth*/ 4) health_changes.maxHealth = /*maxTreeHealth*/ ctx[2];
    			health.$set(health_changes);

    			if (/*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.owner === /*$user*/ ctx[6].name) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$treeGrid, $selectedTile, $user*/ 112) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, t11);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*$treeGrid, $selectedTile*/ 48) && t12_value !== (t12_value = /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.age + "")) set_data_dev(t12, t12_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(tree.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(health.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(tree.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(health.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block0.d();
    			destroy_component(icon0);
    			destroy_component(tree);
    			destroy_component(icon1);
    			destroy_component(health);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(178:2) {#if !showTreeInfo}",
    		ctx
    	});

    	return block;
    }

    // (183:8) {:else}
    function create_else_block$1(ctx) {
    	let h2;
    	let t0_value = /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.owner + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text("'s boom");
    			attr_dev(h2, "class", "svelte-1ebxhfi");
    			add_location(h2, file$6, 183, 10, 3264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$treeGrid, $selectedTile*/ 48 && t0_value !== (t0_value = /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree.owner + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(183:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (181:8) {#if $treeGrid[$selectedTile].tree.owner === $user.name}
    function create_if_block_3$1(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Jouw boom";
    			attr_dev(h2, "class", "svelte-1ebxhfi");
    			add_location(h2, file$6, 181, 10, 3219);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(181:8) {#if $treeGrid[$selectedTile].tree.owner === $user.name}",
    		ctx
    	});

    	return block;
    }

    // (201:6) {#if $treeGrid[$selectedTile].tree.owner === $user.name}
    function create_if_block_2$1(ctx) {
    	let div;
    	let button;
    	let icon;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let button_disabled_value;
    	let current;
    	let mounted;
    	let dispose;

    	icon = new Icon({
    			props: { type: "stappen" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			create_component(icon.$$.fragment);
    			t0 = space();
    			span = element("span");
    			t1 = text("+");
    			t2 = text(/*addHealthAmount*/ ctx[3]);
    			add_location(span, file$6, 206, 12, 4395);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			button.disabled = button_disabled_value = /*addHealthAmount*/ ctx[3] <= 0;
    			attr_dev(button, "class", "svelte-1ebxhfi");
    			add_location(button, file$6, 202, 10, 4167);
    			attr_dev(div, "class", "add-health-container svelte-1ebxhfi");
    			add_location(div, file$6, 201, 8, 4122);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			mount_component(icon, button, null);
    			append_dev(button, t0);
    			append_dev(button, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler_1*/ ctx[10], false, false, false),
    					listen_dev(button, "click", /*click_handler_2*/ ctx[11], { once: true }, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*addHealthAmount*/ 8) set_data_dev(t2, /*addHealthAmount*/ ctx[3]);

    			if (!current || dirty & /*addHealthAmount*/ 8 && button_disabled_value !== (button_disabled_value = /*addHealthAmount*/ ctx[3] <= 0)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(201:6) {#if $treeGrid[$selectedTile].tree.owner === $user.name}",
    		ctx
    	});

    	return block;
    }

    // (225:2) {#each Array($treeGrid[$selectedTile].tree.age + 1) as _, i}
    function create_each_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "./resources/treering.svg")) attr_dev(img, "src", img_src_value);
    			set_style(img, "transform", "scale(" + 0.3 * /*i*/ ctx[17] + ")");
    			attr_dev(img, "alt", "tree ring");
    			attr_dev(img, "class", "svelte-1ebxhfi");
    			add_location(img, file$6, 225, 4, 5127);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(225:2) {#each Array($treeGrid[$selectedTile].tree.age + 1) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$treeGrid*/ ctx[4][/*$selectedTile*/ ctx[5]].tree) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$treeGrid, $selectedTile*/ 48) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const maxAddHealthAmount = 1000;

    function getTreeHealth(tree) {
    	if (tree) {
    		return [tree.health, tree.maxHealth];
    	} else return [null, null];
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $treeGrid;
    	let $selectedTile;
    	let $currency;
    	let $user;
    	let $currentActivities;
    	validate_store(treeGrid, "treeGrid");
    	component_subscribe($$self, treeGrid, $$value => $$invalidate(4, $treeGrid = $$value));
    	validate_store(selectedTile, "selectedTile");
    	component_subscribe($$self, selectedTile, $$value => $$invalidate(5, $selectedTile = $$value));
    	validate_store(currency, "currency");
    	component_subscribe($$self, currency, $$value => $$invalidate(13, $currency = $$value));
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(6, $user = $$value));
    	validate_store(currentActivities, "currentActivities");
    	component_subscribe($$self, currentActivities, $$value => $$invalidate(7, $currentActivities = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TreeDetails", slots, []);
    	let showTreeInfo = false;
    	let treeHealth;
    	let maxTreeHealth;
    	let addHealthAmount = maxAddHealthAmount;

    	function setAddHealthAmount() {
    		$$invalidate(3, addHealthAmount = maxAddHealthAmount);

    		if (maxAddHealthAmount > $currency.stappen) {
    			$$invalidate(3, addHealthAmount = $currency.stappen);
    		}

    		if (treeHealth + addHealthAmount > maxTreeHealth) {
    			$$invalidate(3, addHealthAmount = maxTreeHealth - treeHealth);
    		}
    	}

    	function addHealth(amount) {
    		currency.update(value => {
    			value.stappen -= amount;
    			return value;
    		});

    		set_store_value(treeGrid, $treeGrid[$selectedTile].tree.health += amount, $treeGrid);
    	}

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TreeDetails> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, showTreeInfo = true);
    	const click_handler_1 = () => addHealth(addHealthAmount);
    	const click_handler_2 = () => tutorialStep.set(3);
    	const click_handler_3 = () => $$invalidate(0, showTreeInfo = false);

    	$$self.$capture_state = () => ({
    		Tree,
    		Icon,
    		Health,
    		stepsPerDay,
    		user,
    		treeGrid,
    		selectedTile,
    		currency,
    		tutorialStep,
    		currentActivities,
    		showTreeInfo,
    		treeHealth,
    		maxTreeHealth,
    		maxAddHealthAmount,
    		addHealthAmount,
    		getTreeHealth,
    		setAddHealthAmount,
    		addHealth,
    		$treeGrid,
    		$selectedTile,
    		$currency,
    		$user,
    		$currentActivities
    	});

    	$$self.$inject_state = $$props => {
    		if ("showTreeInfo" in $$props) $$invalidate(0, showTreeInfo = $$props.showTreeInfo);
    		if ("treeHealth" in $$props) $$invalidate(1, treeHealth = $$props.treeHealth);
    		if ("maxTreeHealth" in $$props) $$invalidate(2, maxTreeHealth = $$props.maxTreeHealth);
    		if ("addHealthAmount" in $$props) $$invalidate(3, addHealthAmount = $$props.addHealthAmount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$treeGrid, $selectedTile*/ 48) {
    			 $$invalidate(1, [treeHealth, maxTreeHealth] = getTreeHealth($treeGrid[$selectedTile].tree), treeHealth, (($$invalidate(2, maxTreeHealth), $$invalidate(4, $treeGrid)), $$invalidate(5, $selectedTile)));
    		}

    		if ($$self.$$.dirty & /*treeHealth, $currency*/ 8194) {
    			 (setAddHealthAmount());
    		}
    	};

    	return [
    		showTreeInfo,
    		treeHealth,
    		maxTreeHealth,
    		addHealthAmount,
    		$treeGrid,
    		$selectedTile,
    		$user,
    		$currentActivities,
    		addHealth,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class TreeDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TreeDetails",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/PlantTree.svelte generated by Svelte v3.29.7 */

    const file$7 = "src/components/PlantTree.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (109:8) {#if $currency.stappen < treeCost}
    function create_if_block$3(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: { type: "warning" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(109:8) {#if $currency.stappen < treeCost}",
    		ctx
    	});

    	return block;
    }

    // (118:2) {#each treeTypes as type}
    function create_each_block_1(ctx) {
    	let option;
    	let t0_value = /*type*/ ctx[13] + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*type*/ ctx[13];
    			option.value = option.__value;
    			add_location(option, file$7, 118, 3, 1995);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(118:2) {#each treeTypes as type}",
    		ctx
    	});

    	return block;
    }

    // (125:4) {#each [1,7,30] as i}
    function create_each_block$2(ctx) {
    	let div;
    	let tree;
    	let t;
    	let current;

    	tree = new Tree({
    			props: {
    				tileInfo: {
    					tree: {
    						type: /*selectedTree*/ ctx[0],
    						age: /*i*/ ctx[10]
    					},
    					ground: /*ground*/ ctx[2]
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(tree.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "tree-container svelte-1nfxqdq");
    			add_location(div, file$7, 125, 6, 2123);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(tree, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tree_changes = {};

    			if (dirty & /*selectedTree*/ 1) tree_changes.tileInfo = {
    				tree: {
    					type: /*selectedTree*/ ctx[0],
    					age: /*i*/ ctx[10]
    				},
    				ground: /*ground*/ ctx[2]
    			};

    			tree.$set(tree_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tree.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tree.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(tree);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(125:4) {#each [1,7,30] as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div2;
    	let header;
    	let h2;
    	let t1;
    	let p0;
    	let span;
    	let t2;
    	let t3_value = treeCost.toLocaleString("NL-NL") + "";
    	let t3;
    	let t4;
    	let icon0;
    	let t5;
    	let select;
    	let t6;
    	let div0;
    	let t7;
    	let div1;
    	let p1;
    	let icon1;
    	let t8;
    	let t9_value = (stepsPerDay * (1 + (1 - /*ground*/ ctx[2].growModifier))).toLocaleString("NL-NL") + "";
    	let t9;
    	let t10;
    	let footer;
    	let button;
    	let t11;
    	let button_disabled_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*$currency*/ ctx[1].stappen < treeCost && create_if_block$3(ctx);

    	icon0 = new Icon({
    			props: { type: "stappen" },
    			$$inline: true
    		});

    	let each_value_1 = treeTypes;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = [1, 7, 30];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < 3; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	icon1 = new Icon({
    			props: { type: "stappen" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			header = element("header");
    			h2 = element("h2");
    			h2.textContent = "Plant een boom";
    			t1 = space();
    			p0 = element("p");
    			span = element("span");
    			if (if_block) if_block.c();
    			t2 = text("\n      Benodigd: ");
    			t3 = text(t3_value);
    			t4 = space();
    			create_component(icon0.$$.fragment);
    			t5 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			div0 = element("div");

    			for (let i = 0; i < 3; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			div1 = element("div");
    			p1 = element("p");
    			create_component(icon1.$$.fragment);
    			t8 = text("\n      per dag om de boom gezond te houden: ");
    			t9 = text(t9_value);
    			t10 = space();
    			footer = element("footer");
    			button = element("button");
    			t11 = text("Plant boom");
    			attr_dev(h2, "class", "svelte-1nfxqdq");
    			add_location(h2, file$7, 105, 4, 1657);
    			attr_dev(span, "class", "warning svelte-1nfxqdq");
    			add_location(span, file$7, 107, 6, 1695);
    			attr_dev(p0, "class", "svelte-1nfxqdq");
    			add_location(p0, file$7, 106, 4, 1685);
    			attr_dev(header, "class", "svelte-1nfxqdq");
    			add_location(header, file$7, 104, 2, 1644);
    			if (/*selectedTree*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[4].call(select));
    			add_location(select, file$7, 116, 2, 1929);
    			attr_dev(div0, "class", "tree-preview svelte-1nfxqdq");
    			add_location(div0, file$7, 123, 2, 2064);
    			attr_dev(p1, "class", "svelte-1nfxqdq");
    			add_location(p1, file$7, 137, 4, 2366);
    			attr_dev(div1, "class", "ground-info svelte-1nfxqdq");
    			add_location(div1, file$7, 136, 2, 2336);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			button.disabled = button_disabled_value = /*$currency*/ ctx[1].stappen < treeCost;
    			attr_dev(button, "class", "svelte-1nfxqdq");
    			add_location(button, file$7, 143, 4, 2551);
    			attr_dev(footer, "class", "svelte-1nfxqdq");
    			add_location(footer, file$7, 142, 2, 2538);
    			attr_dev(div2, "class", "container svelte-1nfxqdq");
    			add_location(div2, file$7, 103, 0, 1618);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, header);
    			append_dev(header, h2);
    			append_dev(header, t1);
    			append_dev(header, p0);
    			append_dev(p0, span);
    			if (if_block) if_block.m(span, null);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			mount_component(icon0, p0, null);
    			append_dev(div2, t5);
    			append_dev(div2, select);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select, null);
    			}

    			select_option(select, /*selectedTree*/ ctx[0]);
    			append_dev(div2, t6);
    			append_dev(div2, div0);

    			for (let i = 0; i < 3; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			append_dev(div1, p1);
    			mount_component(icon1, p1, null);
    			append_dev(p1, t8);
    			append_dev(p1, t9);
    			append_dev(div2, t10);
    			append_dev(div2, footer);
    			append_dev(footer, button);
    			append_dev(button, t11);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[4]),
    					listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button, "click", /*click_handler_1*/ ctx[6], { once: true }, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$currency*/ ctx[1].stappen < treeCost) {
    				if (if_block) {
    					if (dirty & /*$currency*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*treeTypes*/ 0) {
    				each_value_1 = treeTypes;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*selectedTree, treeTypes*/ 1) {
    				select_option(select, /*selectedTree*/ ctx[0]);
    			}

    			if (dirty & /*selectedTree, ground*/ 5) {
    				each_value = [1, 7, 30];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < 3; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = 3; i < 3; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*$currency*/ 2 && button_disabled_value !== (button_disabled_value = /*$currency*/ ctx[1].stappen < treeCost)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(icon0.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(icon0.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < 3; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			destroy_component(icon0);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			destroy_component(icon1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const treeCost = 10000;

    function instance$8($$self, $$props, $$invalidate) {
    	let $treeGrid;
    	let $selectedTile;
    	let $user;
    	let $currency;
    	validate_store(treeGrid, "treeGrid");
    	component_subscribe($$self, treeGrid, $$value => $$invalidate(7, $treeGrid = $$value));
    	validate_store(selectedTile, "selectedTile");
    	component_subscribe($$self, selectedTile, $$value => $$invalidate(8, $selectedTile = $$value));
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(9, $user = $$value));
    	validate_store(currency, "currency");
    	component_subscribe($$self, currency, $$value => $$invalidate(1, $currency = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PlantTree", slots, []);
    	let ground = $treeGrid[$selectedTile].ground;
    	let selectedTree = treeTypes[0];

    	function plantTree() {
    		const maxHealth = stepsPerDay * (1 + (1 - ground.growModifier)) * 5;

    		set_store_value(
    			treeGrid,
    			$treeGrid[$selectedTile].tree = {
    				owner: $user.name,
    				type: selectedTree,
    				age: 0,
    				maxHealth,
    				health: maxHealth * 0.8
    			},
    			$treeGrid
    		);

    		currency.update(value => {
    			value.stappen -= 10000;
    			value.bomen += 1;
    			return value;
    		});

    		dialogue.set("treeDetails");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlantTree> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selectedTree = select_value(this);
    		$$invalidate(0, selectedTree);
    	}

    	const click_handler = () => plantTree();
    	const click_handler_1 = () => tutorialStep.set(2);

    	$$self.$capture_state = () => ({
    		Tree,
    		Icon,
    		treeTypes,
    		stepsPerDay,
    		user,
    		treeGrid,
    		currency,
    		dialogue,
    		selectedTile,
    		tutorialStep,
    		treeCost,
    		ground,
    		selectedTree,
    		plantTree,
    		$treeGrid,
    		$selectedTile,
    		$user,
    		$currency
    	});

    	$$self.$inject_state = $$props => {
    		if ("ground" in $$props) $$invalidate(2, ground = $$props.ground);
    		if ("selectedTree" in $$props) $$invalidate(0, selectedTree = $$props.selectedTree);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selectedTree,
    		$currency,
    		ground,
    		plantTree,
    		select_change_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class PlantTree extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlantTree",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/Activity.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$3 } = globals;
    const file$8 = "src/components/Activity.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (97:4) {#if correct === undefined}
    function create_if_block_3$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = `${/*activity*/ ctx[2].text}`;
    			attr_dev(p, "class", "activity svelte-1opz0x7");
    			add_location(p, file$8, 97, 6, 1686);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(97:4) {#if correct === undefined}",
    		ctx
    	});

    	return block;
    }

    // (117:2) {:else}
    function create_else_block_1$1(ctx) {
    	let div;
    	let each_value = Object.keys(/*activity*/ ctx[2].choices);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "options svelte-1opz0x7");
    			add_location(div, file$8, 117, 4, 2111);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tutorialStep, correct, activity, Object, chosenOption*/ 7) {
    				each_value = Object.keys(/*activity*/ ctx[2].choices);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
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
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(117:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (111:30)
    function create_if_block_2$2(ctx) {
    	let div;
    	let p;
    	let t_value = /*activity*/ ctx[2].choices[/*chosenOption*/ ctx[1]].resultText + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-1opz0x7");
    			add_location(p, file$8, 112, 6, 2019);
    			add_location(div, file$8, 111, 4, 2007);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*chosenOption*/ 2 && t_value !== (t_value = /*activity*/ ctx[2].choices[/*chosenOption*/ ctx[1]].resultText + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(111:30) ",
    		ctx
    	});

    	return block;
    }

    // (101:2) {#if correct === true}
    function create_if_block_1$3(ctx) {
    	let div2;
    	let p;
    	let t0_value = /*activity*/ ctx[2].choices[/*chosenOption*/ ctx[1]].resultText + "";
    	let t0;
    	let t1;
    	let div1;
    	let div0;
    	let t4;
    	let icon;
    	let current;

    	icon = new Icon({
    			props: { type: /*reward*/ ctx[3][0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = `+${/*reward*/ ctx[3][1]}`;
    			t4 = space();
    			create_component(icon.$$.fragment);
    			attr_dev(p, "class", "svelte-1opz0x7");
    			add_location(p, file$8, 102, 6, 1789);
    			add_location(div0, file$8, 106, 8, 1891);
    			attr_dev(div1, "class", "reward svelte-1opz0x7");
    			add_location(div1, file$8, 105, 6, 1862);
    			add_location(div2, file$8, 101, 4, 1777);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, p);
    			append_dev(p, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t4);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*chosenOption*/ 2) && t0_value !== (t0_value = /*activity*/ ctx[2].choices[/*chosenOption*/ ctx[1]].resultText + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(101:2) {#if correct === true}",
    		ctx
    	});

    	return block;
    }

    // (119:6) {#each Object.keys(activity.choices) as option}
    function create_each_block$3(ctx) {
    	let button;
    	let t0_value = /*option*/ ctx[9] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[5](/*option*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			attr_dev(button, "class", "svelte-1opz0x7");
    			add_location(button, file$8, 119, 8, 2195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[4], { once: true }, false, false),
    					listen_dev(button, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(119:6) {#each Object.keys(activity.choices) as option}",
    		ctx
    	});

    	return block;
    }

    // (138:2) {:else}
    function create_else_block$2(ctx) {
    	let footer;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			button = element("button");
    			button.textContent = "Sluiten";
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			add_location(button, file$8, 139, 6, 2677);
    			attr_dev(footer, "class", "svelte-1opz0x7");
    			add_location(footer, file$8, 138, 4, 2662);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(138:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (131:2) {#if correct === undefined}
    function create_if_block$4(ctx) {
    	let footer;
    	let div1;
    	let div0;
    	let t2;
    	let icon;
    	let current;

    	icon = new Icon({
    			props: { type: /*reward*/ ctx[3][0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = `+${/*reward*/ ctx[3][1]}`;
    			t2 = space();
    			create_component(icon.$$.fragment);
    			add_location(div0, file$8, 133, 8, 2564);
    			attr_dev(div1, "class", "reward svelte-1opz0x7");
    			add_location(div1, file$8, 132, 6, 2535);
    			attr_dev(footer, "class", "svelte-1opz0x7");
    			add_location(footer, file$8, 131, 4, 2520);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t2);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(131:2) {#if correct === undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let header;
    	let h2;
    	let t1;
    	let t2;
    	let current_block_type_index;
    	let if_block1;
    	let t3;
    	let current_block_type_index_1;
    	let if_block2;
    	let current;
    	let if_block0 = /*correct*/ ctx[0] === undefined && create_if_block_3$2(ctx);
    	const if_block_creators = [create_if_block_1$3, create_if_block_2$2, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*correct*/ ctx[0] === true) return 0;
    		if (/*correct*/ ctx[0] === false) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block$4, create_else_block$2];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*correct*/ ctx[0] === undefined) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block2 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			header = element("header");
    			h2 = element("h2");
    			h2.textContent = `${/*activity*/ ctx[2].type}`;
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if_block1.c();
    			t3 = space();
    			if_block2.c();
    			attr_dev(h2, "class", "svelte-1opz0x7");
    			add_location(h2, file$8, 95, 4, 1623);
    			attr_dev(header, "class", "svelte-1opz0x7");
    			add_location(header, file$8, 94, 2, 1610);
    			attr_dev(div, "class", "container svelte-1opz0x7");
    			add_location(div, file$8, 93, 0, 1584);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, header);
    			append_dev(header, h2);
    			append_dev(header, t1);
    			if (if_block0) if_block0.m(header, null);
    			append_dev(div, t2);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t3);
    			if_blocks_1[current_block_type_index_1].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*correct*/ ctx[0] === undefined) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$2(ctx);
    					if_block0.c();
    					if_block0.m(header, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div, t3);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks_1[current_block_type_index_1];

    				if (!if_block2) {
    					if_block2 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block2.c();
    				} else {
    					if_block2.p(ctx, dirty);
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    			if_blocks_1[current_block_type_index_1].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $currentActivities;
    	let $activeActivity;
    	validate_store(currentActivities, "currentActivities");
    	component_subscribe($$self, currentActivities, $$value => $$invalidate(7, $currentActivities = $$value));
    	validate_store(activeActivity, "activeActivity");
    	component_subscribe($$self, activeActivity, $$value => $$invalidate(8, $activeActivity = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Activity", slots, []);
    	const activity = activitiesList[$currentActivities[$activeActivity.toString()].activity];
    	const reward = $currentActivities[$activeActivity.toString()].reward;
    	let correct = undefined;
    	let chosenOption;
    	const writable_props = [];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Activity> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => tutorialStep.set(4);

    	const click_handler_1 = option => {
    		$$invalidate(0, correct = activity.choices[option].correct);
    		$$invalidate(1, chosenOption = option);
    	};

    	const click_handler_2 = () => dialogue.set("");

    	$$self.$capture_state = () => ({
    		Icon,
    		currentYear,
    		currentActivities,
    		activeActivity,
    		dialogue,
    		currency,
    		tutorialStep,
    		activitiesList,
    		activity,
    		reward,
    		correct,
    		chosenOption,
    		$currentActivities,
    		$activeActivity
    	});

    	$$self.$inject_state = $$props => {
    		if ("correct" in $$props) $$invalidate(0, correct = $$props.correct);
    		if ("chosenOption" in $$props) $$invalidate(1, chosenOption = $$props.chosenOption);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*correct, $activeActivity*/ 257) {
    			// Remove activity if answered
    			 (currentActivities.update(value => {
    				if (correct !== undefined) {
    					delete value[$activeActivity.toString()];
    				}

    				return value;
    			}));
    		}

    		if ($$self.$$.dirty & /*correct*/ 1) {
    			// Add reward
    			 (currency.update(value => {
    				if (correct === true) {
    					value[reward[0]] += reward[1];
    				}

    				return value;
    			}));
    		}
    	};

    	return [
    		correct,
    		chosenOption,
    		activity,
    		reward,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Activity extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Activity",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/DialogueBox.svelte generated by Svelte v3.29.7 */
    const file$9 = "src/components/DialogueBox.svelte";

    function create_fragment$a(ctx) {
    	let div2;
    	let div1;
    	let button;
    	let t;
    	let div0;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			button = element("button");
    			t = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			attr_dev(button, "class", "close-button svelte-ma1mph");
    			add_location(button, file$9, 51, 4, 931);
    			attr_dev(div0, "class", "content svelte-ma1mph");
    			add_location(div0, file$9, 52, 4, 1036);
    			attr_dev(div1, "class", "dialogue svelte-ma1mph");
    			add_location(div1, file$9, 50, 2, 861);
    			attr_dev(div2, "class", "dialogue-container svelte-ma1mph");
    			add_location(div2, file$9, 49, 0, 826);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			append_dev(div1, t);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: 200, duration: 300 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: 200, duration: 300 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DialogueBox", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DialogueBox> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dialogue.set("");

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ fly, dialogue });
    	return [$$scope, slots, click_handler];
    }

    class DialogueBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DialogueBox",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/Introduction.svelte generated by Svelte v3.29.7 */
    const file$a = "src/components/Introduction.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (95:4) {#each Array(totalSteps) as _, i}
    function create_each_block$4(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[1](/*i*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "step svelte-17fgk3w");
    			toggle_class(span, "active", /*currentStep*/ ctx[0] == /*i*/ ctx[5] + 1);
    			add_location(span, file$a, 95, 6, 1589);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*currentStep*/ 1) {
    				toggle_class(span, "active", /*currentStep*/ ctx[0] == /*i*/ ctx[5] + 1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(95:4) {#each Array(totalSteps) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (120:27)
    function create_if_block_5(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "./resources/introduction/tree.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Boom");
    			attr_dev(img, "class", "svelte-17fgk3w");
    			add_location(img, file$a, 121, 4, 3143);
    			attr_dev(div, "class", "introduction-container svelte-17fgk3w");
    			add_location(div, file$a, 120, 2, 3014);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { delay: 300, x: 100, duration: 300 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { x: -100, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(120:27) ",
    		ctx
    	});

    	return block;
    }

    // (116:27)
    function create_if_block_4(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "./resources/introduction/health.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Iconen wandelingen, water, recyclen");
    			attr_dev(img, "class", "svelte-17fgk3w");
    			add_location(img, file$a, 117, 4, 2883);
    			attr_dev(div, "class", "introduction-container svelte-17fgk3w");
    			add_location(div, file$a, 116, 2, 2754);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { delay: 300, x: 100, duration: 300 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { x: -100, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(116:27) ",
    		ctx
    	});

    	return block;
    }

    // (112:27)
    function create_if_block_3$3(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "./resources/introduction/tree-example.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Verzorg en groei je eigen boom door zelf gezond te leven.");
    			attr_dev(img, "class", "svelte-17fgk3w");
    			add_location(img, file$a, 113, 4, 2595);
    			attr_dev(div, "class", "introduction-container svelte-17fgk3w");
    			add_location(div, file$a, 112, 2, 2466);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { delay: 300, x: 100, duration: 300 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { x: -100, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(112:27) ",
    		ctx
    	});

    	return block;
    }

    // (108:27)
    function create_if_block_2$3(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "./resources/introduction/eenwoud-example.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Maak deel uit van een gezamelijk, virtueel bos met dezelfde waarden en principes van het echte Eenwoud.");
    			attr_dev(img, "class", "svelte-17fgk3w");
    			add_location(img, file$a, 109, 4, 2258);
    			attr_dev(div, "class", "introduction-container svelte-17fgk3w");
    			add_location(div, file$a, 108, 2, 2129);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { delay: 300, x: 100, duration: 300 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { x: -100, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(108:27) ",
    		ctx
    	});

    	return block;
    }

    // (101:0) {#if currentStep == 1}
    function create_if_block_1$4(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t1;
    	let img;
    	let img_src_value;
    	let div2_intro;
    	let div2_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Welkom bij";
    			t1 = space();
    			img = element("img");
    			attr_dev(div0, "class", "svelte-17fgk3w");
    			add_location(div0, file$a, 103, 6, 1960);
    			attr_dev(img, "class", "eenwoud-logo svelte-17fgk3w");
    			if (img.src !== (img_src_value = "./resources/introduction/eenwoud-logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Eenwoud");
    			add_location(img, file$a, 104, 6, 1988);
    			attr_dev(div1, "class", "eenwoud-logo-container svelte-17fgk3w");
    			add_location(div1, file$a, 102, 4, 1917);
    			attr_dev(div2, "class", "introduction-container svelte-17fgk3w");
    			add_location(div2, file$a, 101, 2, 1788);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, img);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				if (!div2_intro) div2_intro = create_in_transition(div2, fly, { delay: 300, x: 100, duration: 300 });
    				div2_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fly, { x: -100, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_outro) div2_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(101:0) {#if currentStep == 1}",
    		ctx
    	});

    	return block;
    }

    // (130:4) {:else}
    function create_else_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Klik om verder te gaan");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(130:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (128:4) {#if currentStep === totalSteps}
    function create_if_block$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Start het spel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(128:4) {#if currentStep === totalSteps}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let header;
    	let div;
    	let header_transition;
    	let t0;
    	let main;
    	let current_block_type_index;
    	let if_block0;
    	let main_transition;
    	let t1;
    	let footer;
    	let span;
    	let t2;
    	let button;
    	let footer_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = Array(totalSteps);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const if_block_creators = [
    		create_if_block_1$4,
    		create_if_block_2$3,
    		create_if_block_3$3,
    		create_if_block_4,
    		create_if_block_5
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentStep*/ ctx[0] == 1) return 0;
    		if (/*currentStep*/ ctx[0] == 2) return 1;
    		if (/*currentStep*/ ctx[0] == 3) return 2;
    		if (/*currentStep*/ ctx[0] == 4) return 3;
    		if (/*currentStep*/ ctx[0] == 5) return 4;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentStep*/ ctx[0] === totalSteps) return create_if_block$5;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			footer = element("footer");
    			span = element("span");
    			if_block1.c();
    			t2 = space();
    			button = element("button");
    			attr_dev(div, "class", "step-counter svelte-17fgk3w");
    			add_location(div, file$a, 93, 2, 1518);
    			add_location(header, file$a, 92, 0, 1469);
    			attr_dev(main, "class", "svelte-17fgk3w");
    			add_location(main, file$a, 99, 0, 1718);
    			attr_dev(span, "class", "next-text svelte-17fgk3w");
    			add_location(span, file$a, 126, 2, 3274);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "name", "button");
    			attr_dev(button, "class", "next-button svelte-17fgk3w");
    			add_location(button, file$a, 133, 2, 3420);
    			add_location(footer, file$a, 125, 0, 3225);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, span);
    			if_block1.m(span, null);
    			append_dev(footer, t2);
    			append_dev(footer, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentStep*/ 1) {
    				each_value = Array(totalSteps);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					} else {
    						if_block0.p(ctx, dirty);
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(main, null);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(span, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!header_transition) header_transition = create_bidirectional_transition(header, fade, { duration: 300 }, true);
    				header_transition.run(1);
    			});

    			transition_in(if_block0);

    			add_render_callback(() => {
    				if (!main_transition) main_transition = create_bidirectional_transition(main, fade, { duration: 300 }, true);
    				main_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!footer_transition) footer_transition = create_bidirectional_transition(footer, fade, { duration: 300 }, true);
    				footer_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!header_transition) header_transition = create_bidirectional_transition(header, fade, { duration: 300 }, false);
    			header_transition.run(0);
    			transition_out(if_block0);
    			if (!main_transition) main_transition = create_bidirectional_transition(main, fade, { duration: 300 }, false);
    			main_transition.run(0);
    			if (!footer_transition) footer_transition = create_bidirectional_transition(footer, fade, { duration: 300 }, false);
    			footer_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_each(each_blocks, detaching);
    			if (detaching && header_transition) header_transition.end();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (detaching && main_transition) main_transition.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(footer);
    			if_block1.d();
    			if (detaching && footer_transition) footer_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const totalSteps = 5;

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Introduction", slots, []);
    	let currentStep = 1;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Introduction> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => $$invalidate(0, currentStep = i + 1);
    	const click_handler_1 = () => $$invalidate(0, currentStep += 1);
    	$$self.$capture_state = () => ({ fade, fly, user, currentStep, totalSteps });

    	$$self.$inject_state = $$props => {
    		if ("currentStep" in $$props) $$invalidate(0, currentStep = $$props.currentStep);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentStep*/ 1) {
    			 if (currentStep > totalSteps) {
    				$$invalidate(0, currentStep = totalSteps);

    				user.update(value => {
    					value.introduction = false;
    					return value;
    				});
    			}
    		}
    	};

    	return [currentStep, click_handler, click_handler_1];
    }

    class Introduction extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Introduction",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/Tutorial.svelte generated by Svelte v3.29.7 */
    const file$b = "src/components/Tutorial.svelte";

    // (49:0) {:else}
    function create_else_block$4(ctx) {
    	let div;
    	let icon;
    	let div_intro;
    	let current;

    	icon = new Icon({
    			props: { type: "eenwoud", size: 2.3 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			add_location(div, file$b, 49, 2, 1190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(icon, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fly, { delay: 300, y: -50, duration: 300 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(49:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (45:27)
    function create_if_block_2$4(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(/*currentStep*/ ctx[0]);
    			t1 = text(".");
    			t2 = text(" Los een gebeurtenis op");
    			attr_dev(span, "class", "svelte-6x0jwi");
    			add_location(span, file$b, 46, 4, 1120);
    			attr_dev(div, "class", "tutorial-container svelte-6x0jwi");
    			add_location(div, file$b, 45, 2, 997);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*currentStep*/ 1) set_data_dev(t0, /*currentStep*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { delay: 300, y: -50, duration: 300 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 50, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(45:27) ",
    		ctx
    	});

    	return block;
    }

    // (41:27)
    function create_if_block_1$5(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(/*currentStep*/ ctx[0]);
    			t1 = text(".");
    			t2 = text(" Geef je boom voeding");
    			attr_dev(span, "class", "svelte-6x0jwi");
    			add_location(span, file$b, 42, 4, 909);
    			attr_dev(div, "class", "tutorial-container svelte-6x0jwi");
    			add_location(div, file$b, 41, 2, 786);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*currentStep*/ 1) set_data_dev(t0, /*currentStep*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { delay: 300, y: -50, duration: 300 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 50, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(41:27) ",
    		ctx
    	});

    	return block;
    }

    // (37:0) {#if currentStep == 1}
    function create_if_block$6(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(/*currentStep*/ ctx[0]);
    			t1 = text(".");
    			t2 = text(" Plant je eerste boom");
    			attr_dev(span, "class", "svelte-6x0jwi");
    			add_location(span, file$b, 38, 4, 698);
    			attr_dev(div, "class", "tutorial-container svelte-6x0jwi");
    			add_location(div, file$b, 37, 2, 624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*currentStep*/ 1) set_data_dev(t0, /*currentStep*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			div_outro = create_out_transition(div, fly, { y: 50, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(37:0) {#if currentStep == 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$6, create_if_block_1$5, create_if_block_2$4, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentStep*/ ctx[0] == 1) return 0;
    		if (/*currentStep*/ ctx[0] == 2) return 1;
    		if (/*currentStep*/ ctx[0] == 3) return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container svelte-6x0jwi");
    			add_location(div, file$b, 35, 0, 575);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tutorial", slots, []);
    	let currentStep = 1;

    	tutorialStep.subscribe(value => {
    		if (value - 1 === currentStep) $$invalidate(0, currentStep = value);
    		return value;
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tutorial> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fly,
    		Icon,
    		tutorialStep,
    		currency,
    		currentStep
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentStep" in $$props) $$invalidate(0, currentStep = $$props.currentStep);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentStep];
    }

    class Tutorial extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tutorial",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.7 */

    const file$c = "src/App.svelte";

    // (43:0) {:else}
    function create_else_block$5(ctx) {
    	let header;
    	let tutorial;
    	let t0;
    	let div2;
    	let div0;
    	let currency0;
    	let t1;
    	let div1;
    	let currency1;
    	let header_transition;
    	let t2;
    	let main;
    	let treegrid;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let main_transition;
    	let t4;
    	let footer;
    	let div3;
    	let yearcounter;
    	let footer_transition;
    	let current;
    	let mounted;
    	let dispose;
    	tutorial = new Tutorial({ $$inline: true });

    	currency0 = new Currency({
    			props: { displayCurrency: "stappen" },
    			$$inline: true
    		});

    	currency1 = new Currency({
    			props: { displayCurrency: "bomen", inverted: true },
    			$$inline: true
    		});

    	treegrid = new TreeGrid({ $$inline: true });
    	const if_block_creators = [create_if_block_1$6, create_if_block_2$5, create_if_block_3$4];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*$dialogue*/ ctx[0] === "plantTree") return 0;
    		if (/*$dialogue*/ ctx[0] === "treeDetails") return 1;
    		if (/*$dialogue*/ ctx[0] === "activity") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	yearcounter = new YearCounter({ $$inline: true });

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(tutorial.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			create_component(currency0.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(currency1.$$.fragment);
    			t2 = space();
    			main = element("main");
    			create_component(treegrid.$$.fragment);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();
    			footer = element("footer");
    			div3 = element("div");
    			create_component(yearcounter.$$.fragment);
    			add_location(div0, file$c, 46, 6, 1236);
    			add_location(div1, file$c, 52, 6, 1415);
    			attr_dev(div2, "class", "header-container svelte-1jh2vi7");
    			add_location(div2, file$c, 45, 4, 1199);
    			add_location(header, file$c, 43, 2, 1124);
    			add_location(main, file$c, 57, 2, 1521);
    			add_location(div3, file$c, 74, 4, 1968);
    			add_location(footer, file$c, 73, 2, 1910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(tutorial, header, null);
    			append_dev(header, t0);
    			append_dev(header, div2);
    			append_dev(div2, div0);
    			mount_component(currency0, div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(currency1, div1, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(treegrid, main, null);
    			append_dev(main, t3);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			insert_dev(target, t4, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div3);
    			mount_component(yearcounter, div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(div3, "click", /*click_handler_1*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tutorial.$$.fragment, local);
    			transition_in(currency0.$$.fragment, local);
    			transition_in(currency1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!header_transition) header_transition = create_bidirectional_transition(header, fly, { y: -100, duration: 800 }, true);
    				header_transition.run(1);
    			});

    			transition_in(treegrid.$$.fragment, local);
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (!main_transition) main_transition = create_bidirectional_transition(main, fade, { duration: 800 }, true);
    				main_transition.run(1);
    			});

    			transition_in(yearcounter.$$.fragment, local);

    			add_render_callback(() => {
    				if (!footer_transition) footer_transition = create_bidirectional_transition(footer, fly, { y: 100, duration: 800 }, true);
    				footer_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tutorial.$$.fragment, local);
    			transition_out(currency0.$$.fragment, local);
    			transition_out(currency1.$$.fragment, local);
    			if (!header_transition) header_transition = create_bidirectional_transition(header, fly, { y: -100, duration: 800 }, false);
    			header_transition.run(0);
    			transition_out(treegrid.$$.fragment, local);
    			transition_out(if_block);
    			if (!main_transition) main_transition = create_bidirectional_transition(main, fade, { duration: 800 }, false);
    			main_transition.run(0);
    			transition_out(yearcounter.$$.fragment, local);
    			if (!footer_transition) footer_transition = create_bidirectional_transition(footer, fly, { y: 100, duration: 800 }, false);
    			footer_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(tutorial);
    			destroy_component(currency0);
    			destroy_component(currency1);
    			if (detaching && header_transition) header_transition.end();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			destroy_component(treegrid);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (detaching && main_transition) main_transition.end();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(footer);
    			destroy_component(yearcounter);
    			if (detaching && footer_transition) footer_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(43:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:0) {#if $user.introduction}
    function create_if_block$7(ctx) {
    	let introduction;
    	let current;
    	introduction = new Introduction({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(introduction.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(introduction, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(introduction.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(introduction.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(introduction, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(41:0) {#if $user.introduction}",
    		ctx
    	});

    	return block;
    }

    // (68:39)
    function create_if_block_3$4(ctx) {
    	let dialoguebox;
    	let current;

    	dialoguebox = new DialogueBox({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dialoguebox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dialoguebox, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialoguebox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dialoguebox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dialoguebox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$4.name,
    		type: "if",
    		source: "(68:39) ",
    		ctx
    	});

    	return block;
    }

    // (64:42)
    function create_if_block_2$5(ctx) {
    	let dialoguebox;
    	let current;

    	dialoguebox = new DialogueBox({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dialoguebox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dialoguebox, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialoguebox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dialoguebox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dialoguebox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$5.name,
    		type: "if",
    		source: "(64:42) ",
    		ctx
    	});

    	return block;
    }

    // (60:4) {#if $dialogue === "plantTree"}
    function create_if_block_1$6(ctx) {
    	let dialoguebox;
    	let current;

    	dialoguebox = new DialogueBox({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dialoguebox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dialoguebox, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialoguebox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dialoguebox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dialoguebox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(60:4) {#if $dialogue === \\\"plantTree\\\"}",
    		ctx
    	});

    	return block;
    }

    // (69:6) <DialogueBox>
    function create_default_slot_2(ctx) {
    	let activity;
    	let current;
    	activity = new Activity({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(activity.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(activity, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(activity.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(activity.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(activity, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(69:6) <DialogueBox>",
    		ctx
    	});

    	return block;
    }

    // (65:6) <DialogueBox>
    function create_default_slot_1(ctx) {
    	let treedetails;
    	let current;
    	treedetails = new TreeDetails({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(treedetails.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(treedetails, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(treedetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(treedetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(treedetails, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(65:6) <DialogueBox>",
    		ctx
    	});

    	return block;
    }

    // (61:6) <DialogueBox>
    function create_default_slot(ctx) {
    	let planttree;
    	let current;
    	planttree = new PlantTree({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(planttree.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(planttree, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(planttree.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(planttree.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(planttree, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(61:6) <DialogueBox>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$7, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$user*/ ctx[1].introduction) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $dialogue;
    	let $user;
    	let $currentYear;
    	validate_store(dialogue, "dialogue");
    	component_subscribe($$self, dialogue, $$value => $$invalidate(0, $dialogue = $$value));
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(1, $user = $$value));
    	validate_store(currentYear, "currentYear");
    	component_subscribe($$self, currentYear, $$value => $$invalidate(2, $currentYear = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	currentYear.subscribe(value => {
    		if ($dialogue === "activity") {
    			dialogue.set("");
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => currency.update(value => {
    		value.stappen += 2000;
    		return value;
    	});

    	const click_handler_1 = () => currentYear.set($currentYear + 1);

    	$$self.$capture_state = () => ({
    		fly,
    		fade,
    		Currency,
    		YearCounter,
    		Tree,
    		TreeGrid,
    		TreeDetails,
    		PlantTree,
    		Activity,
    		DialogueBox,
    		Introduction,
    		Tutorial,
    		Icon,
    		currency,
    		currentYear,
    		dialogue,
    		selectedTile,
    		user,
    		$dialogue,
    		$user,
    		$currentYear
    	});

    	return [$dialogue, $user, $currentYear, click_handler, click_handler_1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
