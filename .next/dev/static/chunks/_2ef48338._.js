(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90',
            destructive: 'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
            outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
            link: 'text-primary underline-offset-4 hover:underline'
        },
        size: {
            default: 'h-9 px-4 py-2 has-[>svg]:px-3',
            sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
            lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
            icon: 'size-9',
            'icon-sm': 'size-8',
            'icon-lg': 'size-10'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'default'
    }
});
function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : 'button';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/button.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/navbar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Navbar",
    ()=>Navbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$cart$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/cart-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$user$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/user-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$wishlist$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/wishlist-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-cart.js [app-client] (ecmascript) <export default as ShoppingCart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-client] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gift$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gift$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gift.js [app-client] (ecmascript) <export default as Gift>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hand$2d$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HandHeart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/hand-heart.js [app-client] (ecmascript) <export default as HandHeart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gem$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gem.js [app-client] (ecmascript) <export default as Gem>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2d$handshake$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HeartHandshake$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart-handshake.js [app-client] (ecmascript) <export default as HeartHandshake>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$party$2d$popper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PartyPopper$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/party-popper.js [app-client] (ecmascript) <export default as PartyPopper>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/flame.js [app-client] (ecmascript) <export default as Flame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tree$2d$pine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TreePine$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/tree-pine.js [app-client] (ecmascript) <export default as TreePine>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
const categories = [
    {
        name: "Birthday Cards",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gift$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gift$3e$__["Gift"],
        href: "/templates?category=birthday"
    },
    {
        name: "Thank You Cards",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hand$2d$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HandHeart$3e$__["HandHeart"],
        href: "/templates?category=thank-you"
    },
    {
        name: "Wedding Cards",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gem$3e$__["Gem"],
        href: "/templates?category=wedding"
    },
    {
        name: "Anniversary Cards",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2d$handshake$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HeartHandshake$3e$__["HeartHandshake"],
        href: "/templates?category=anniversary"
    },
    {
        name: "Festival Cards",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$party$2d$popper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PartyPopper$3e$__["PartyPopper"],
        href: "/templates?category=festival"
    },
    {
        name: "Diwali Cards",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__["Flame"],
        href: "/templates?category=diwali"
    },
    {
        name: "Christmas Cards",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tree$2d$pine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TreePine$3e$__["TreePine"],
        href: "/templates?category=christmas"
    }
];
function Navbar() {
    _s();
    const [isMenuOpen, setIsMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const { profile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$user$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUser"])();
    const { items: wishlistItems } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$wishlist$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWishlist"])();
    const { items: cartItems } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$cart$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCart"])();
    const accountHref = profile ? "/account" : "/login";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "sticky top-0 z-50 w-full border-b border-border bg-card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            src: "/logo.svg",
                            alt: "CardCraft",
                            width: 130,
                            height: 24,
                            className: "h-6 w-auto",
                            priority: true
                        }, void 0, false, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/navbar.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden flex-1 items-center justify-center md:flex",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex w-full max-w-md items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    placeholder: "Search templates...",
                                    value: searchQuery,
                                    onChange: (e)=>setSearchQuery(e.target.value),
                                    className: "h-10 w-full rounded-l-md border border-r-0 border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 48,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "flex h-10 items-center justify-center rounded-r-md bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/90",
                                    "aria-label": "Search",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/components/navbar.tsx",
                                        lineNumber: 59,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 55,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/navbar.tsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden items-center gap-4 md:flex",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                asChild: true,
                                className: "bg-primary text-primary-foreground hover:bg-primary/90",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/templates",
                                    children: "Sample Button"
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 67,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/navbar.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/wishlist",
                                className: "relative p-2 text-muted-foreground transition-colors hover:text-foreground",
                                "aria-label": "Wishlist",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
                                        className: "h-5 w-5"
                                    }, void 0, false, {
                                        fileName: "[project]/components/navbar.tsx",
                                        lineNumber: 75,
                                        columnNumber: 13
                                    }, this),
                                    wishlistItems.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground",
                                        children: wishlistItems.length
                                    }, void 0, false, {
                                        fileName: "[project]/components/navbar.tsx",
                                        lineNumber: 77,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/navbar.tsx",
                                lineNumber: 70,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/cart",
                                className: "relative p-2 text-muted-foreground transition-colors hover:text-foreground",
                                "aria-label": "Cart",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"], {
                                        className: "h-5 w-5"
                                    }, void 0, false, {
                                        fileName: "[project]/components/navbar.tsx",
                                        lineNumber: 88,
                                        columnNumber: 13
                                    }, this),
                                    cartItems.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground",
                                        children: cartItems.length
                                    }, void 0, false, {
                                        fileName: "[project]/components/navbar.tsx",
                                        lineNumber: 90,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/navbar.tsx",
                                lineNumber: 83,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: accountHref,
                                className: "p-2 text-muted-foreground transition-colors hover:text-foreground",
                                "aria-label": profile ? "Account" : "Login",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 97,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/navbar.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/navbar.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "md:hidden",
                        onClick: ()=>setIsMenuOpen(!isMenuOpen),
                        "aria-label": "Toggle menu",
                        children: isMenuOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            className: "h-6 w-6 text-foreground"
                        }, void 0, false, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 108,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                            className: "h-6 w-6 text-foreground"
                        }, void 0, false, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 110,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/navbar.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/navbar.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            isMenuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-t border-border bg-card md:hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col gap-4 px-4 py-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    placeholder: "Search templates...",
                                    value: searchQuery,
                                    onChange: (e)=>setSearchQuery(e.target.value),
                                    className: "h-10 w-full rounded-l-md border border-r-0 border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 121,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "flex h-10 items-center justify-center rounded-r-md bg-primary px-4 text-primary-foreground",
                                    "aria-label": "Search",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/components/navbar.tsx",
                                        lineNumber: 132,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 128,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 120,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/templates",
                            className: "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                            onClick: ()=>setIsMenuOpen(false),
                            children: "Templates"
                        }, void 0, false, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 136,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/how-it-works",
                            className: "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                            onClick: ()=>setIsMenuOpen(false),
                            children: "How It Works"
                        }, void 0, false, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 143,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/pricing",
                            className: "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                            onClick: ()=>setIsMenuOpen(false),
                            children: "Pricing"
                        }, void 0, false, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 150,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/wishlist",
                            className: "flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                            onClick: ()=>setIsMenuOpen(false),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 162,
                                    columnNumber: 15
                                }, this),
                                "Wishlist",
                                wishlistItems.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground",
                                    children: wishlistItems.length
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 165,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 157,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/cart",
                            className: "flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                            onClick: ()=>setIsMenuOpen(false),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"], {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 175,
                                    columnNumber: 15
                                }, this),
                                "Cart",
                                cartItems.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground",
                                    children: cartItems.length
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 178,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 170,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: accountHref,
                            className: "flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                            onClick: ()=>setIsMenuOpen(false),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 188,
                                    columnNumber: 15
                                }, this),
                                profile ? "Account" : "Login"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 183,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            asChild: true,
                            className: "w-full bg-primary text-primary-foreground hover:bg-primary/90",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/templates",
                                children: "Sample Button"
                            }, void 0, false, {
                                fileName: "[project]/components/navbar.tsx",
                                lineNumber: 192,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 191,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/navbar.tsx",
                    lineNumber: 118,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/navbar.tsx",
                lineNumber: 117,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hidden border-t border-border bg-card md:block",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto flex max-w-7xl items-center justify-center gap-8 px-4 py-3 sm:px-6 lg:px-8",
                    children: categories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: category.href,
                            className: "group flex flex-col items-center gap-1 text-primary transition-colors hover:text-accent",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(category.icon, {
                                    className: "h-5 w-5",
                                    strokeWidth: 1.5
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 207,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-medium",
                                    children: category.name
                                }, void 0, false, {
                                    fileName: "[project]/components/navbar.tsx",
                                    lineNumber: 208,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, category.name, true, {
                            fileName: "[project]/components/navbar.tsx",
                            lineNumber: 202,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/components/navbar.tsx",
                    lineNumber: 200,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/navbar.tsx",
                lineNumber: 199,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/navbar.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
_s(Navbar, "WMs5i6LvGdfAvrD6ElOiZWpBJtM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$user$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUser"],
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$wishlist$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWishlist"],
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$cart$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCart"]
    ];
});
_c = Navbar;
var _c;
__turbopack_context__.k.register(_c, "Navbar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/input.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
function Input({ className, type, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        "data-slot": "input",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm', 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]', 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/input.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = Input;
;
var _c;
__turbopack_context__.k.register(_c, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/templates.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Single source of truth for template metadata.
 * Used by the templates listing page and the editor.
 */ __turbopack_context__.s([
    "allTemplates",
    ()=>allTemplates,
    "getTemplateById",
    ()=>getTemplateById
]);
const allTemplates = [
    {
        id: "1",
        name: "Birthday Celebration",
        category: "Birthday",
        price: 99,
        colors: [
            "#FDE68A",
            "#F59E0B"
        ],
        emoji: "🎂",
        svg: "/assets/greeting-card.svg"
    },
    {
        id: "2",
        name: "Wedding Elegance",
        category: "Wedding",
        price: 149,
        colors: [
            "#FDF2F8",
            "#EC4899"
        ],
        emoji: "💒",
        svg: "/assets/greeting-card-2.svg"
    },
    {
        id: "3",
        name: "Thank You Blooms",
        category: "Thank You",
        price: 79,
        colors: [
            "#DCFCE7",
            "#22C55E"
        ],
        emoji: "💐",
        svg: "/assets/greeting-card-3.svg"
    },
    {
        id: "4",
        name: "Holiday Cheer",
        category: "Holiday",
        price: 99,
        colors: [
            "#FEE2E2",
            "#EF4444"
        ],
        emoji: "🎄",
        svg: "/assets/greeting-card.svg"
    },
    {
        id: "5",
        name: "Corporate Thanks",
        category: "Corporate",
        price: 129,
        colors: [
            "#DBEAFE",
            "#3B82F6"
        ],
        emoji: "🤝",
        svg: "/assets/greeting-card.svg"
    },
    {
        id: "6",
        name: "Baby Shower",
        category: "Birthday",
        price: 89,
        colors: [
            "#E0E7FF",
            "#6366F1"
        ],
        emoji: "👶",
        svg: "/assets/greeting-card.svg"
    },
    {
        id: "7",
        name: "Romantic Anniversary",
        category: "Wedding",
        price: 119,
        colors: [
            "#FECDD3",
            "#F43F5E"
        ],
        emoji: "💕",
        svg: "/assets/greeting-card.svg"
    },
    {
        id: "8",
        name: "Graduation Day",
        category: "Birthday",
        price: 99,
        colors: [
            "#FEF3C7",
            "#D97706"
        ],
        emoji: "🎓",
        svg: "/assets/greeting-card.svg"
    },
    {
        id: "9",
        name: "New Year Wishes",
        category: "Holiday",
        price: 89,
        colors: [
            "#E0F2FE",
            "#0284C7"
        ],
        emoji: "🎉",
        svg: "/assets/greeting-card.svg"
    },
    {
        id: "10",
        name: "Professional Note",
        category: "Corporate",
        price: 109,
        colors: [
            "#F1F5F9",
            "#475569"
        ],
        emoji: "📝",
        svg: "/assets/greeting-card.svg"
    },
    {
        id: "11",
        name: "Mother's Day Love",
        category: "Thank You",
        price: 99,
        colors: [
            "#FCE7F3",
            "#DB2777"
        ],
        emoji: "🌸",
        svg: "/assets/greeting-card.svg"
    },
    {
        id: "12",
        name: "Winter Wonderland",
        category: "Holiday",
        price: 99,
        colors: [
            "#F0F9FF",
            "#38BDF8"
        ],
        emoji: "❄️",
        svg: "/assets/greeting-card.svg"
    }
];
const byId = new Map(allTemplates.map((t)=>[
        t.id,
        t
    ]));
function getTemplateById(id) {
    return byId.get(id);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/editor-svg-utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Utilities for SVG field editor: size, text metrics, clip bounds, snap guides.
 */ __turbopack_context__.s([
    "applySnap",
    ()=>applySnap,
    "createGuideLine",
    ()=>createGuideLine,
    "getClipBounds",
    ()=>getClipBounds,
    "getSVGElementSize",
    ()=>getSVGElementSize,
    "getSVGSize",
    ()=>getSVGSize,
    "getTextMetrics",
    ()=>getTextMetrics,
    "hideGuides",
    ()=>hideGuides,
    "textOverlayRect",
    ()=>textOverlayRect
]);
function getSVGElementSize(svgEl) {
    let w = parseFloat(svgEl.getAttribute("width") || "0");
    let h = parseFloat(svgEl.getAttribute("height") || "0");
    if (!w || !h) {
        const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number);
        w = vb[2] || 800;
        h = vb[3] || 600;
    }
    return {
        w: w || 800,
        h: h || 600
    };
}
function getSVGSize(doc) {
    const root = doc.documentElement;
    let w = parseFloat(root.getAttribute("width") || "0");
    let h = parseFloat(root.getAttribute("height") || "0");
    console.log("w", w, "h", h);
    if (!w || !h) {
        const vb = (root.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number);
        w = vb[2] || 800;
        h = vb[3] || 600;
    }
    return {
        w: w || 800,
        h: h || 600
    };
}
function getTextMetrics(txt, fontSize, fontWeight, fontFamily) {
    if (typeof document === "undefined") return {
        width: 0,
        ascent: fontSize * 0.8,
        descent: fontSize * 0.2
    };
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    if (!ctx) return {
        width: 0,
        ascent: fontSize * 0.8,
        descent: fontSize * 0.2
    };
    ctx.font = `${fontWeight || "normal"} ${fontSize}px ${fontFamily || "sans-serif"}`;
    const m = ctx.measureText(txt || "");
    return {
        width: m.width,
        ascent: m.actualBoundingBoxAscent ?? fontSize * 0.8,
        descent: m.actualBoundingBoxDescent ?? fontSize * 0.2
    };
}
function textOverlayRect(tel) {
    const tx = parseFloat(tel.getAttribute("x") || "0");
    const ty = parseFloat(tel.getAttribute("y") || "0");
    const fsAttr = tel.getAttribute("font-size") || tel.style?.fontSize || "16";
    const fs = parseFloat(fsAttr);
    const fw = tel.getAttribute("font-weight") || "normal";
    const ff = tel.getAttribute("font-family") || "sans-serif";
    const anchor = tel.getAttribute("text-anchor") || "start";
    const txt = tel.textContent || "";
    const { width, ascent, descent } = getTextMetrics(txt || "W", fs, fw, ff);
    const PAD = fs * 0.08;
    let rx;
    let ry;
    let rw;
    let rh;
    // Prefer real rendered bounds when available (handles multiline <tspan> and nested styling)
    try {
        const bb = tel.getBBox?.();
        if (bb && bb.width > 0 && bb.height > 0) {
            rx = bb.x - PAD;
            ry = bb.y - PAD;
            rw = bb.width + PAD * 2;
            rh = bb.height + PAD * 2;
        } else {
            throw new Error("empty bbox");
        }
    } catch  {
        if (anchor === "middle") rx = tx - width / 2 - PAD;
        else if (anchor === "end") rx = tx - width - PAD;
        else rx = tx - PAD;
        ry = ty - ascent - PAD;
        rw = width + PAD * 2;
        rh = ascent + descent + PAD * 2;
    }
    return {
        rx,
        ry,
        rw,
        rh,
        tx,
        ty,
        fs,
        fw,
        ff,
        anchor,
        width,
        ascent,
        descent
    };
}
function getClipBounds(doc, clipAttr) {
    if (!clipAttr || !clipAttr.includes("url(#")) return null;
    const id = clipAttr.replace("url(#", "").replace(")", "").trim();
    const clipEl = doc.getElementById(id);
    if (!clipEl) return null;
    const rect = clipEl.querySelector("rect");
    if (rect) return {
        x: parseFloat(rect.getAttribute("x") || "0"),
        y: parseFloat(rect.getAttribute("y") || "0"),
        w: parseFloat(rect.getAttribute("width") || "100"),
        h: parseFloat(rect.getAttribute("height") || "100")
    };
    return null;
}
// Snap threshold: how close (in SVG units) before snapping engages
const SNAP = 6;
function hideGuides(svgEl) {
    ;
    [
        "guide-cx",
        "guide-cy",
        "guide-left",
        "guide-right",
        "guide-top",
        "guide-bottom"
    ].forEach((id)=>{
        const el = svgEl.querySelector("#" + id);
        if (el) el.style.display = "none";
    });
}
function createGuideLine(svgEl, id, x1, y1, x2, y2) {
    const ns = "http://www.w3.org/2000/svg";
    let l = svgEl.querySelector("#" + id);
    if (!l) {
        l = document.createElementNS(ns, "line");
        l.setAttribute("id", id);
        svgEl.appendChild(l);
    }
    l.setAttribute("x1", String(x1));
    l.setAttribute("y1", String(y1));
    l.setAttribute("x2", String(x2));
    l.setAttribute("y2", String(y2));
    l.setAttribute("stroke", "#378ADD");
    l.setAttribute("stroke-width", "0.6");
    l.setAttribute("stroke-dasharray", "4 3");
    l.setAttribute("pointer-events", "none");
    l.style.display = "block";
}
function applySnap(svgEl, cx, cy, txtW, txtH) {
    // Use the SVG viewport size as the snapping frame.
    const { w: frameW, h: frameH } = getSVGElementSize(svgEl);
    const frameX = 0;
    const frameY = 0;
    let nx = cx;
    let ny = cy;
    const guides = [];
    // Horizontal center (vertical guide line through canvas center)
    const centerX = frameX + frameW / 2;
    if (Math.abs(cx - centerX) < SNAP) {
        nx = centerX;
        guides.push("cx");
    }
    // Vertical center (horizontal guide line through canvas center)
    // cy = top of text, so center of text = cy + txtH/2
    // We want text center to align with canvas center → cy target = centerY - txtH/2
    const centerY = frameY + frameH / 2;
    if (Math.abs(cy - (centerY - txtH / 2)) < SNAP) {
        ny = centerY - txtH / 2;
        guides.push("cy");
    }
    // Bug 2 fix: cy is TOP of text box (ty - ascent), so:
    //   left/right edges snap cx (text horizontal center) — unchanged
    //   top edge: cy should equal frameY (text top flush with canvas top)
    //   bottom edge: cy should equal frameY + frameH - txtH (text bottom flush with canvas bottom)
    // Left edge: text left side flush with canvas left → cx = frameX + txtW/2
    if (Math.abs(cx - (frameX + txtW / 2)) < SNAP) {
        nx = frameX + txtW / 2;
        guides.push("left");
    }
    // Right edge: text right side flush with canvas right → cx = frameX + frameW - txtW/2
    const rightEdge = frameX + frameW - txtW / 2;
    const diffRight = Math.abs(cx - rightEdge);
    console.log("cx", cx, "diffRight", diffRight, "rightTarget", rightEdge);
    console.log("cx", cx, "cx + txtW", cx + txtW, "frameW", frameW);
    if (Math.abs(cx - (frameX + frameW - txtW / 2)) < SNAP) {
        nx = frameX + frameW - txtW / 2;
        guides.push("right");
    }
    // Top edge: text top flush with canvas top → cy = frameY
    if (Math.abs(cy - frameY) < SNAP) {
        ny = frameY;
        guides.push("top");
    }
    // Bottom edge: text bottom flush with canvas bottom → cy = frameY + frameH - txtH
    if (Math.abs(cy - (frameY + frameH - txtH)) < SNAP) {
        ny = frameY + frameH - txtH;
        guides.push("bottom");
    }
    return {
        nx,
        ny,
        guides,
        frameX,
        frameY,
        frameW,
        frameH
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/editor/[id]/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EditorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$navbar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/navbar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$cart$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/cart-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$templates$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/templates.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-cart.js [app-client] (ecmascript) <export default as ShoppingCart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-svg-utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
const EDITABLE_PREFIX = "editable_";
const IMAGE_ZONE_PREFIX = "image_zone_";
// Multiplier to make image drag feel more responsive.
// 1 = geometric mapping only, >1 = faster movement.
const IMAGE_DRAG_SPEED = 4;
const IMAGE_COMPRESS_QUALITY = 0.75;
const IMAGE_COMPRESS_SKIP_BELOW_BYTES = 500 * 1024;
async function fileToDataUrl(file) {
    return await new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>resolve(reader.result || "");
        reader.onerror = ()=>reject(new Error("FileReader failed"));
        reader.readAsDataURL(file);
    });
}
async function compressImageFileToJpegDataUrl(file) {
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.decoding = "async";
        await new Promise((resolve, reject)=>{
            img.onload = ()=>resolve();
            img.onerror = ()=>reject(new Error("Image load failed"));
            img.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas context");
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise((resolve, reject)=>{
            canvas.toBlob((b)=>{
                if (!b) reject(new Error("toBlob failed"));
                else resolve(b);
            }, "image/jpeg", IMAGE_COMPRESS_QUALITY);
        });
        const dataUrl = await fileToDataUrl(blob);
        return {
            dataUrl,
            w: img.naturalWidth,
            h: img.naturalHeight,
            outBytes: blob.size
        };
    } finally{
        URL.revokeObjectURL(url);
    }
}
/** Selector for element by id (avoids template literals in JSX for Turbopack) */ function idSelector(id) {
    return "[id=\"" + id + "\"]";
}
function EditorPage({ params }) {
    _s();
    const resolvedParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["use"])(params);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { add: addToCart } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$cart$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCart"])();
    const template = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$templates$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTemplateById"])(resolvedParams.id) ?? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$templates$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allTemplates"][0];
    const svgDocRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const previewContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fileInputRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    const panelInputRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    const [previewVersion, setPreviewVersion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [textFields, setTextFields] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [imageZones, setImageZones] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [textValues, setTextValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [zoneStates, setZoneStates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [zoneBusy, setZoneBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [isExporting, setIsExporting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [svgLoaded, setSvgLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Load template SVG
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorPage.useEffect": ()=>{
            if (!template.svg) {
                setSvgLoaded(false);
                return;
            }
            fetch(template.svg).then({
                "EditorPage.useEffect": (r)=>r.text()
            }["EditorPage.useEffect"]).then({
                "EditorPage.useEffect": (svgText)=>{
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(svgText, "image/svg+xml");
                    svgDocRef.current = doc;
                    const textEls = Array.from(doc.querySelectorAll(`[id^="${EDITABLE_PREFIX}"]`));
                    setTextFields(textEls.map({
                        "EditorPage.useEffect": (el)=>({
                                id: el.getAttribute("id"),
                                label: (el.getAttribute("id") || "").replace(EDITABLE_PREFIX, "").replace(/_/g, " ")
                            })
                    }["EditorPage.useEffect"]));
                    const textVals = {};
                    textEls.forEach({
                        "EditorPage.useEffect": (el)=>{
                            const id = el.getAttribute("id");
                            if (id) textVals[id] = el.textContent?.trim() ?? "";
                        }
                    }["EditorPage.useEffect"]);
                    setTextValues(textVals);
                    const imageEls = Array.from(doc.querySelectorAll(`[id^="${IMAGE_ZONE_PREFIX}"]`));
                    const zones = [];
                    const zStates = {};
                    imageEls.forEach({
                        "EditorPage.useEffect": (el)=>{
                            const id = el.getAttribute("id");
                            if (!id) return;
                            const clipAttr = el.getAttribute("clip-path") || "";
                            const hasClip = clipAttr.includes("url(#");
                            const clipBounds = hasClip ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClipBounds"])(doc, clipAttr) : null;
                            const zoneX = clipBounds ? clipBounds.x : parseFloat(el.getAttribute("x") || "0");
                            const zoneY = clipBounds ? clipBounds.y : parseFloat(el.getAttribute("y") || "0");
                            const zoneW = clipBounds ? clipBounds.w : parseFloat(el.getAttribute("width") || "100");
                            const zoneH = clipBounds ? clipBounds.h : parseFloat(el.getAttribute("height") || "100");
                            zones.push({
                                id,
                                label: id.replace(IMAGE_ZONE_PREFIX, "").replace(/_/g, " "),
                                zoneX,
                                zoneY,
                                zoneW,
                                zoneH,
                                hasClip
                            });
                            zStates[id] = {
                                b64: "",
                                scale: 1,
                                offsetX: 0,
                                offsetY: 0,
                                imgW: 0,
                                imgH: 0,
                                zoneX,
                                zoneY,
                                zoneW,
                                zoneH,
                                hasClip,
                                existingClipId: hasClip ? clipAttr : null
                            };
                        }
                    }["EditorPage.useEffect"]);
                    setImageZones(zones);
                    setZoneStates(zStates);
                    setPreviewVersion({
                        "EditorPage.useEffect": (v)=>v + 1
                    }["EditorPage.useEffect"]);
                    setSvgLoaded(true);
                }
            }["EditorPage.useEffect"]).catch({
                "EditorPage.useEffect": ()=>setSvgLoaded(false)
            }["EditorPage.useEffect"]);
        }
    }["EditorPage.useEffect"], [
        template.svg
    ]);
    // Apply image zone data into svgDoc (so serialized preview shows images)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorPage.useEffect": ()=>{
            const doc = svgDocRef.current;
            if (!doc) return;
            const ns = "http://www.w3.org/2000/svg";
            Object.keys(zoneStates).forEach({
                "EditorPage.useEffect": (zoneId)=>{
                    const st = zoneStates[zoneId];
                    let el = doc.querySelector(idSelector(zoneId));
                    if (!el) return;
                    if (!st?.b64) {
                        if (el.tagName?.toLowerCase() === "image") {
                            el.setAttribute("href", "");
                            el.setAttribute("xlink:href", "");
                        }
                        return;
                    }
                    // If zone element is not an image (e.g. rect placeholder), create image and replace
                    if (el.tagName?.toLowerCase() !== "image") {
                        const img = doc.createElementNS(ns, "image");
                        img.setAttribute("id", zoneId);
                        el.parentNode?.replaceChild(img, el);
                        el = img;
                    }
                    const imgEl = el;
                    const { zoneX, zoneY, zoneW, zoneH, scale, offsetX, offsetY, imgW, imgH } = st;
                    const sb = Math.max(zoneW / imgW, zoneH / imgH);
                    const imgW2 = imgW * sb * scale;
                    const imgH2 = imgH * sb * scale;
                    const cx = zoneX + (zoneW - imgW2) / 2 + offsetX;
                    const cy = zoneY + (zoneH - imgH2) / 2 + offsetY;
                    imgEl.setAttribute("href", st.b64);
                    imgEl.setAttribute("xlink:href", st.b64);
                    imgEl.setAttribute("x", String(cx));
                    imgEl.setAttribute("y", String(cy));
                    imgEl.setAttribute("width", String(imgW2));
                    imgEl.setAttribute("height", String(imgH2));
                    imgEl.setAttribute("preserveAspectRatio", "none");
                    if (st.hasClip && st.existingClipId) {
                        imgEl.setAttribute("clip-path", st.existingClipId);
                    } else {
                        // Create clipPath for zone bounds so image is clipped to zone
                        const clipId = "clip_" + zoneId.replace(/[^a-z0-9_-]/gi, "_");
                        let defs = doc.querySelector("defs");
                        if (!defs) {
                            defs = doc.createElementNS(ns, "defs");
                            doc.documentElement.insertBefore(defs, doc.documentElement.firstChild);
                        }
                        if (!doc.getElementById(clipId)) {
                            const clip = doc.createElementNS(ns, "clipPath");
                            clip.setAttribute("id", clipId);
                            const r = doc.createElementNS(ns, "rect");
                            r.setAttribute("x", String(zoneX));
                            r.setAttribute("y", String(zoneY));
                            r.setAttribute("width", String(zoneW));
                            r.setAttribute("height", String(zoneH));
                            clip.appendChild(r);
                            defs.appendChild(clip);
                        }
                        imgEl.setAttribute("clip-path", `url(#${clipId})`);
                    }
                }
            }["EditorPage.useEffect"]);
        }
    }["EditorPage.useEffect"], [
        zoneStates
    ]);
    // Render preview and attach handlers
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorPage.useEffect": ()=>{
            const container = previewContainerRef.current;
            const doc = svgDocRef.current;
            if (!container || !doc || previewVersion === 0) return;
            const s = new XMLSerializer().serializeToString(doc);
            const parser = new DOMParser();
            const previewDoc = parser.parseFromString(s, "image/svg+xml");
            const svgEl = previewDoc.documentElement;
            svgEl.style.cssText = "max-width:100%;max-height:100%;display:block;border-radius:var(--rounded-md)";
            const { w: svgW, h: svgH } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSVGElementSize"])(svgEl);
            // const { w: svgElW, h: svgElH } = getSVGElementSize(svgEl)
            if (!svgEl.getAttribute("viewBox")) {
                svgEl.setAttribute("viewBox", "0 0 " + svgW + " " + svgH);
            }
            const ns = "http://www.w3.org/2000/svg";
            // Center crosshair guide (thin cross through SVG center)
            const centerGuideVId = "center-guide-v";
            const centerGuideHId = "center-guide-h";
            let centerV = previewDoc.getElementById(centerGuideVId);
            if (!centerV) {
                centerV = previewDoc.createElementNS(ns, "line");
                centerV.setAttribute("id", centerGuideVId);
                centerV.setAttribute("x1", String(svgW / 2));
                centerV.setAttribute("y1", "0");
                centerV.setAttribute("x2", String(svgW / 2));
                centerV.setAttribute("y2", String(svgH));
                centerV.setAttribute("stroke", "#378ADD");
                centerV.setAttribute("stroke-width", "0.8");
                centerV.setAttribute("stroke-dasharray", "3 3");
                centerV.setAttribute("pointer-events", "none");
                svgEl.insertBefore(centerV, svgEl.firstChild);
            }
            let centerH = previewDoc.getElementById(centerGuideHId);
            if (!centerH) {
                centerH = previewDoc.createElementNS(ns, "line");
                centerH.setAttribute("id", centerGuideHId);
                centerH.setAttribute("x1", "0");
                centerH.setAttribute("y1", String(svgH / 2));
                centerH.setAttribute("x2", String(svgW));
                centerH.setAttribute("y2", String(svgH / 2));
                centerH.setAttribute("stroke", "#378ADD");
                centerH.setAttribute("stroke-width", "0.8");
                centerH.setAttribute("stroke-dasharray", "3 3");
                centerH.setAttribute("pointer-events", "none");
                svgEl.insertBefore(centerH, svgEl.firstChild);
            }
            // Image zone overlays
            Object.entries(zoneStates).forEach({
                "EditorPage.useEffect": ([zoneId, st])=>{
                    const clipBounds = st.hasClip && st.existingClipId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClipBounds"])(previewDoc, st.existingClipId) : null;
                    const zoneX = clipBounds ? clipBounds.x : st.zoneX;
                    const zoneY = clipBounds ? clipBounds.y : st.zoneY;
                    const zoneW = clipBounds ? clipBounds.w : st.zoneW;
                    const zoneH = clipBounds ? clipBounds.h : st.zoneH;
                    if (!st.b64) {
                        const cx = zoneX + zoneW / 2;
                        const cy = zoneY + zoneH / 2;
                        const r = Math.min(zoneW, zoneH) * 0.09;
                        const is = r * 0.52;
                        const g = previewDoc.createElementNS(ns, "g");
                        g.setAttribute("id", "upload_icon_" + zoneId);
                        g.setAttribute("pointer-events", "none");
                        const circ = previewDoc.createElementNS(ns, "circle");
                        circ.setAttribute("cx", String(cx));
                        circ.setAttribute("cy", String(cy));
                        circ.setAttribute("r", String(r));
                        circ.setAttribute("fill", "rgba(55,138,221,0.13)");
                        circ.setAttribute("stroke", "rgba(55,138,221,0.4)");
                        circ.setAttribute("stroke-width", "1");
                        g.appendChild(circ);
                        [
                            [
                                cx,
                                cy + is * 0.35,
                                cx,
                                cy - is * 0.45
                            ],
                            [
                                cx,
                                cy - is * 0.45,
                                cx - is * 0.32,
                                cy - is * 0.13
                            ],
                            [
                                cx,
                                cy - is * 0.45,
                                cx + is * 0.32,
                                cy - is * 0.13
                            ],
                            [
                                cx - is * 0.38,
                                cy + is * 0.38,
                                cx + is * 0.38,
                                cy + is * 0.38
                            ]
                        ].forEach({
                            "EditorPage.useEffect": ([x1, y1, x2, y2])=>{
                                const l = previewDoc.createElementNS(ns, "line");
                                l.setAttribute("x1", String(x1));
                                l.setAttribute("y1", String(y1));
                                l.setAttribute("x2", String(x2));
                                l.setAttribute("y2", String(y2));
                                l.setAttribute("stroke", "#378ADD");
                                l.setAttribute("stroke-width", "1.5");
                                l.setAttribute("stroke-linecap", "round");
                                g.appendChild(l);
                            }
                        }["EditorPage.useEffect"]);
                        svgEl.appendChild(g);
                        const hotspot = previewDoc.createElementNS(ns, "rect");
                        hotspot.setAttribute("x", String(zoneX));
                        hotspot.setAttribute("y", String(zoneY));
                        hotspot.setAttribute("width", String(zoneW));
                        hotspot.setAttribute("height", String(zoneH));
                        hotspot.setAttribute("fill", "none");
                        hotspot.setAttribute("data-upload-zone", zoneId);
                        hotspot.setAttribute("pointer-events", "all");
                        hotspot.setAttribute("style", "cursor:pointer");
                        if (st.hasClip && st.existingClipId) hotspot.setAttribute("clip-path", st.existingClipId);
                        svgEl.appendChild(hotspot);
                    } else {
                        const rect = previewDoc.createElementNS(ns, "rect");
                        rect.setAttribute("x", String(zoneX));
                        rect.setAttribute("y", String(zoneY));
                        rect.setAttribute("width", String(zoneW));
                        rect.setAttribute("height", String(zoneH));
                        rect.setAttribute("fill", "transparent");
                        rect.setAttribute("data-img-zone", zoneId);
                        rect.setAttribute("style", "cursor:grab");
                        if (st.hasClip && st.existingClipId) rect.setAttribute("clip-path", st.existingClipId);
                        svgEl.appendChild(rect);
                    }
                }
            }["EditorPage.useEffect"]);
            // Text zone overlays
            textFields.forEach({
                "EditorPage.useEffect": ({ id: tid })=>{
                    const tel = svgEl.querySelector(idSelector(tid));
                    if (!tel) return;
                    const { rx, ry, rw, rh } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["textOverlayRect"])(tel);
                    const ov = previewDoc.createElementNS(ns, "rect");
                    ov.setAttribute("x", String(rx));
                    ov.setAttribute("y", String(ry));
                    ov.setAttribute("width", String(rw));
                    ov.setAttribute("height", String(rh));
                    ov.setAttribute("fill", "transparent");
                    ov.setAttribute("stroke", "red");
                    ov.setAttribute("stroke-width", "1");
                    ov.setAttribute("stroke-dasharray", "3 2");
                    ov.setAttribute("rx", "2");
                    ov.setAttribute("style", "cursor:grab");
                    ov.setAttribute("data-text-zone", tid);
                    ov.setAttribute("id", "overlay_" + tid);
                    svgEl.appendChild(ov);
                }
            }["EditorPage.useEffect"]);
            container.innerHTML = "";
            container.appendChild(svgEl);
            // After inserting into DOM, recompute text overlays using getBBox() (needed for multiline tspans).
            textFields.forEach({
                "EditorPage.useEffect": ({ id: tid })=>{
                    const tel = svgEl.querySelector(idSelector(tid));
                    const ov = svgEl.querySelector("#overlay_" + tid);
                    if (!tel || !ov) return;
                    const r = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["textOverlayRect"])(tel);
                    ov.setAttribute("x", String(r.rx));
                    ov.setAttribute("y", String(r.ry));
                    ov.setAttribute("width", String(r.rw));
                    ov.setAttribute("height", String(r.rh));
                }
            }["EditorPage.useEffect"]);
            let drag = null;
            function getScale() {
                const bbox = svgEl.getBoundingClientRect();
                const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number);
                return {
                    sx: vb[2] / bbox.width,
                    sy: vb[3] / bbox.height
                };
            }
            function openEditor(tid) {
                const docEl = svgDocRef.current?.querySelector(idSelector(tid));
                if (!docEl) return;
                const liveText = svgEl.querySelector(idSelector(tid));
                if (!liveText) return;
                const ov = svgEl.querySelector("#overlay_" + tid);
                const bbox = svgEl.getBoundingClientRect();
                const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number);
                const scaleX = bbox.width / vb[2];
                const scaleY = bbox.height / vb[3];
                const st = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["textOverlayRect"])(liveText);
                const cs = ("TURBOPACK compile-time truthy", 1) ? window.getComputedStyle(liveText) : "TURBOPACK unreachable";
                const fillColor = (cs?.getPropertyValue("fill") || "").trim() || liveText.getAttribute("fill") || "#111";
                const fontFamily = (cs?.fontFamily || "").trim() || st.ff;
                const fontWeight = (cs?.fontWeight || "").trim() || st.fw;
                const getLeafTspans = {
                    "EditorPage.useEffect.openEditor.getLeafTspans": (textEl)=>{
                        const all = Array.from(textEl.querySelectorAll("tspan"));
                        // "Leaf" tspans: tspans that do not contain other tspans. This matches Inkscape multiline templates.
                        const leaf = all.filter({
                            "EditorPage.useEffect.openEditor.getLeafTspans.leaf": (t)=>t.querySelectorAll("tspan").length === 0
                        }["EditorPage.useEffect.openEditor.getLeafTspans.leaf"]);
                        leaf.sort({
                            "EditorPage.useEffect.openEditor.getLeafTspans": (a, b)=>{
                                const ay = parseFloat(a.getAttribute("y") || "0");
                                const by = parseFloat(b.getAttribute("y") || "0");
                                if (ay !== by) return ay - by;
                                const ax = parseFloat(a.getAttribute("x") || "0");
                                const bx = parseFloat(b.getAttribute("x") || "0");
                                return ax - bx;
                            }
                        }["EditorPage.useEffect.openEditor.getLeafTspans"]);
                        return leaf;
                    }
                }["EditorPage.useEffect.openEditor.getLeafTspans"];
                const leafTspans = getLeafTspans(liveText);
                // If a template has at least one leaf <tspan>, open a multiline editor so the user can add more lines.
                const isMultiline = leafTspans.length >= 1;
                const lines = leafTspans.map({
                    "EditorPage.useEffect.openEditor.lines": (t)=>t.textContent || ""
                }["EditorPage.useEffect.openEditor.lines"]);
                const txt = isMultiline ? lines.join("\n") : lines[0] || liveText.textContent || "";
                const screenX = (st.rx - vb[0]) * scaleX;
                const screenY = (st.ry - vb[1]) * scaleY;
                const screenW = st.rw * scaleX;
                const screenH = st.rh * scaleY;
                const screenFs = parseFloat(cs?.fontSize || "") || st.fs * scaleX;
                const applyTextToTextEl = {
                    "EditorPage.useEffect.openEditor.applyTextToTextEl": (target, val)=>{
                        const leaf = getLeafTspans(target);
                        const parts = val.split("\n");
                        // #region agent log
                        fetch("http://127.0.0.1:7918/ingest/0625c21e-ccbe-468d-acee-2a41c806255c", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-Debug-Session-Id": "d7e809"
                            },
                            body: JSON.stringify({
                                sessionId: "d7e809",
                                runId: "pre-fix-merge-lines",
                                hypothesisId: "H1",
                                location: "app/editor/[id]/page.tsx:applyTextToTextEl:entry",
                                message: "applyTextToTextEl entry",
                                data: {
                                    tid,
                                    leafCount: leaf.length,
                                    partsCount: parts.length,
                                    inputVal: val,
                                    leafTexts: leaf.map({
                                        "EditorPage.useEffect.openEditor.applyTextToTextEl": (t)=>t.textContent || ""
                                    }["EditorPage.useEffect.openEditor.applyTextToTextEl"])
                                },
                                timestamp: Date.now()
                            })
                        }).catch({
                            "EditorPage.useEffect.openEditor.applyTextToTextEl": ()=>{}
                        }["EditorPage.useEffect.openEditor.applyTextToTextEl"]);
                        // #endregion
                        if (parts.length > 1) {
                            // If we have multiline input but no leaf tspans exist, fall back to plain textContent.
                            if (leaf.length === 0) {
                                target.textContent = val;
                                return;
                            }
                            // If user typed more lines than existing leaf <tspan>s, create new leaf tspans.
                            if (parts.length > leaf.length) {
                                const firstX = parseFloat(leaf[0].getAttribute("x") || "0");
                                const firstY = parseFloat(leaf[0].getAttribute("y") || "0");
                                const lastTemplate = leaf[leaf.length - 1];
                                // Font-based line step: prefer computed lineHeight if numeric, else derive from font-size.
                                const cstyle = ("TURBOPACK compile-time truthy", 1) ? window.getComputedStyle(target) : "TURBOPACK unreachable";
                                const lineHeightStr = cstyle?.lineHeight || "";
                                const lineHeightPx = Number.parseFloat(lineHeightStr);
                                const fontSizePx = Number.parseFloat(cstyle?.fontSize || "") || parseFloat(target.getAttribute("font-size") || "") || screenFs;
                                const stepY = Number.isFinite(lineHeightPx) && lineHeightPx > 0 ? lineHeightPx : fontSizePx * 1.25;
                                for(let i = leaf.length; i < parts.length; i++){
                                    const newLeaf = lastTemplate.cloneNode(false);
                                    // Avoid duplicate IDs; these are not needed for our logic.
                                    newLeaf.removeAttribute("id");
                                    newLeaf.setAttribute("x", String(firstX));
                                    newLeaf.setAttribute("y", String(firstY + i * stepY));
                                    newLeaf.textContent = parts[i] ?? "";
                                    target.appendChild(newLeaf);
                                }
                            }
                            const leaf2 = getLeafTspans(target);
                            leaf2.forEach({
                                "EditorPage.useEffect.openEditor.applyTextToTextEl": (t, i)=>{
                                    t.textContent = parts[i] ?? "";
                                }
                            }["EditorPage.useEffect.openEditor.applyTextToTextEl"]);
                            // #region agent log
                            fetch("http://127.0.0.1:7918/ingest/0625c21e-ccbe-468d-acee-2a41c806255c", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-Debug-Session-Id": "d7e809"
                                },
                                body: JSON.stringify({
                                    sessionId: "d7e809",
                                    runId: "pre-fix-merge-lines",
                                    hypothesisId: "H2",
                                    location: "app/editor/[id]/page.tsx:applyTextToTextEl:multiline",
                                    message: "applied multiline mapping",
                                    data: {
                                        tid,
                                        partsCount: parts.length,
                                        leaf2Count: leaf2.length,
                                        leaf2Texts: leaf2.map({
                                            "EditorPage.useEffect.openEditor.applyTextToTextEl": (t)=>t.textContent || ""
                                        }["EditorPage.useEffect.openEditor.applyTextToTextEl"])
                                    },
                                    timestamp: Date.now()
                                })
                            }).catch({
                                "EditorPage.useEffect.openEditor.applyTextToTextEl": ()=>{}
                            }["EditorPage.useEffect.openEditor.applyTextToTextEl"]);
                        // #endregion
                        } else {
                            if (leaf.length > 0) {
                                // Collapse to a single visible line: keep first leaf text, clear stale extra lines.
                                leaf[0].textContent = val;
                                for(let i = 1; i < leaf.length; i++)leaf[i].textContent = "";
                            } else {
                                const t = target.querySelector("tspan");
                                if (t) t.textContent = val;
                                else target.textContent = val;
                            }
                            // #region agent log
                            fetch("http://127.0.0.1:7918/ingest/0625c21e-ccbe-468d-acee-2a41c806255c", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-Debug-Session-Id": "d7e809"
                                },
                                body: JSON.stringify({
                                    sessionId: "d7e809",
                                    runId: "pre-fix-merge-lines",
                                    hypothesisId: "H3",
                                    location: "app/editor/[id]/page.tsx:applyTextToTextEl:singleline",
                                    message: "applied single-line mapping",
                                    data: {
                                        tid,
                                        targetTextContent: target.textContent || "",
                                        firstLeafTexts: getLeafTspans(target).map({
                                            "EditorPage.useEffect.openEditor.applyTextToTextEl": (x)=>x.textContent || ""
                                        }["EditorPage.useEffect.openEditor.applyTextToTextEl"])
                                    },
                                    timestamp: Date.now()
                                })
                            }).catch({
                                "EditorPage.useEffect.openEditor.applyTextToTextEl": ()=>{}
                            }["EditorPage.useEffect.openEditor.applyTextToTextEl"]);
                        // #endregion
                        }
                    }
                }["EditorPage.useEffect.openEditor.applyTextToTextEl"];
                const editorEl = document.createElement(isMultiline ? "textarea" : "input");
                if (!isMultiline) editorEl.type = "text";
                editorEl.value = txt;
                if (isMultiline) {
                    editorEl.style.cssText = `position:absolute;left:${bbox.left + screenX}px;top:${bbox.top + screenY}px;width:${Math.max(screenW, 40)}px;height:${screenH}px;font-size:${screenFs}px;font-family:${fontFamily};font-weight:${fontWeight};color:${fillColor};background:rgba(255,255,255,0.93);border:1.5px solid #378ADD;border-radius:2px;padding:2px 4px;outline:none;z-index:100;resize:none;overflow:auto;white-space:pre;line-height:normal;`;
                } else {
                    editorEl.style.cssText = `position:absolute;left:${bbox.left + screenX}px;top:${bbox.top + screenY}px;width:${Math.max(screenW, 40)}px;height:${screenH}px;font-size:${screenFs}px;font-family:${fontFamily};font-weight:${fontWeight};color:${fillColor};background:rgba(255,255,255,0.93);border:1.5px solid #378ADD;border-radius:2px;padding:0 4px;outline:none;z-index:100;`;
                }
                editorEl.addEventListener("input", {
                    "EditorPage.useEffect.openEditor": ()=>{
                        const val = editorEl.value;
                        const docEl2 = svgDocRef.current?.querySelector(idSelector(tid));
                        if (docEl2) applyTextToTextEl(docEl2, val);
                        setTextValues({
                            "EditorPage.useEffect.openEditor": (prev)=>({
                                    ...prev,
                                    [tid]: val
                                })
                        }["EditorPage.useEffect.openEditor"]);
                        const panel = panelInputRefs.current[tid];
                        if (panel) panel.value = val;
                    }
                }["EditorPage.useEffect.openEditor"]);
                const overlayDiv = document.createElement("div");
                overlayDiv.id = "txt-editor-overlay";
                overlayDiv.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;";
                overlayDiv.appendChild(editorEl);
                const commit = {
                    "EditorPage.useEffect.openEditor.commit": ()=>{
                        if (overlayDiv.parentNode) overlayDiv.parentNode.removeChild(overlayDiv);
                        const val = editorEl.value;
                        const docEl2 = svgDocRef.current?.querySelector(idSelector(tid));
                        if (docEl2) applyTextToTextEl(docEl2, val);
                        setTextValues({
                            "EditorPage.useEffect.openEditor.commit": (prev)=>({
                                    ...prev,
                                    [tid]: val
                                })
                        }["EditorPage.useEffect.openEditor.commit"]);
                        const panel = panelInputRefs.current[tid];
                        if (panel) panel.value = val;
                        if (liveText) {
                            applyTextToTextEl(liveText, val);
                            liveText.style.display = "";
                        }
                        if (ov && liveText) {
                            const r = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["textOverlayRect"])(liveText);
                            ov.setAttribute("x", String(r.rx));
                            ov.setAttribute("y", String(r.ry));
                            ov.setAttribute("width", String(r.rw));
                            ov.setAttribute("height", String(r.rh));
                            ov.style.display = "";
                        }
                        setPreviewVersion({
                            "EditorPage.useEffect.openEditor.commit": (v)=>v + 1
                        }["EditorPage.useEffect.openEditor.commit"]);
                    }
                }["EditorPage.useEffect.openEditor.commit"];
                editorEl.addEventListener("keydown", {
                    "EditorPage.useEffect.openEditor": (e)=>{
                        const ke = e;
                        if (ke.key === "Escape") {
                            e.preventDefault();
                            commit();
                            return;
                        }
                        if (!isMultiline && ke.key === "Enter") {
                            e.preventDefault();
                            commit();
                        }
                        if (isMultiline && (ke.metaKey || ke.ctrlKey) && ke.key === "Enter") {
                            e.preventDefault();
                            commit();
                        }
                    }
                }["EditorPage.useEffect.openEditor"]);
                editorEl.addEventListener("blur", {
                    "EditorPage.useEffect.openEditor": ()=>setTimeout(commit, 80)
                }["EditorPage.useEffect.openEditor"]);
                liveText.style.display = "none";
                if (ov) ov.style.display = "none";
                if (container) container.appendChild(overlayDiv);
                editorEl.style.pointerEvents = "auto";
                editorEl.focus();
                if (!isMultiline) editorEl.select();
            }
            const onMouseDown = {
                "EditorPage.useEffect.onMouseDown": (e)=>{
                    const imgOv = e.target.closest("[data-img-zone]");
                    const txtOv = e.target.closest("[data-text-zone]");
                    const up = e.target.closest("[data-upload-zone]");
                    if (up) {
                        const zoneId = up.getAttribute("data-upload-zone");
                        if (zoneId && fileInputRefs.current[zoneId]) fileInputRefs.current[zoneId].click();
                        return;
                    }
                    if (!imgOv && !txtOv) return;
                    e.preventDefault();
                    const { sx, sy } = getScale();
                    if (imgOv) {
                        const zoneId = imgOv.getAttribute("data-img-zone");
                        const st = zoneStates[zoneId];
                        if (!st?.b64) return;
                        drag = {
                            type: "img",
                            id: zoneId,
                            overlay: imgOv,
                            sx,
                            sy,
                            startX: e.clientX,
                            startY: e.clientY,
                            startOX: st.offsetX,
                            startOY: st.offsetY,
                            moved: false
                        };
                        imgOv.style.cursor = "grabbing";
                    }
                    if (txtOv) {
                        const tid = txtOv.getAttribute("data-text-zone");
                        const docEl = svgDocRef.current?.querySelector(idSelector(tid));
                        if (!docEl) return;
                        const firstTspan = docEl.querySelector("tspan");
                        const startTX = parseFloat(firstTspan?.getAttribute("x") || docEl.getAttribute("x") || "0");
                        const startTY = parseFloat(firstTspan?.getAttribute("y") || docEl.getAttribute("y") || "0");
                        drag = {
                            type: "txt",
                            id: tid,
                            overlay: txtOv,
                            sx,
                            sy,
                            startX: e.clientX,
                            startY: e.clientY,
                            startTX,
                            startTY,
                            moved: false
                        };
                        txtOv.style.cursor = "grabbing";
                    }
                }
            }["EditorPage.useEffect.onMouseDown"];
            const onMouseMove = {
                "EditorPage.useEffect.onMouseMove": (e)=>{
                    if (!drag) return;
                    const dx = e.clientX - drag.startX;
                    const dy = e.clientY - drag.startY;
                    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
                    if (!drag.moved) return;
                    if (drag.type === "img") {
                        // Capture drag fields; React may run state updaters after drag is cleared.
                        const dragId = drag.id;
                        const startOX = drag.startOX ?? 0;
                        const startOY = drag.startOY ?? 0;
                        const sx = drag.sx;
                        const sy = drag.sy;
                        setZoneStates({
                            "EditorPage.useEffect.onMouseMove": (prev)=>{
                                const st = prev[dragId];
                                if (!st) return prev;
                                return {
                                    ...prev,
                                    [dragId]: {
                                        ...st,
                                        offsetX: startOX + dx * sx * IMAGE_DRAG_SPEED,
                                        offsetY: startOY + dy * sy * IMAGE_DRAG_SPEED
                                    }
                                };
                            }
                        }["EditorPage.useEffect.onMouseMove"]);
                        setPreviewVersion({
                            "EditorPage.useEffect.onMouseMove": (v)=>v + 1
                        }["EditorPage.useEffect.onMouseMove"]);
                    }
                    if (drag.type === "txt") {
                        const rawX = (drag.startTX ?? 0) + dx * drag.sx;
                        const rawY = (drag.startTY ?? 0) + dy * drag.sy;
                        const liveText = svgEl.querySelector(idSelector(drag.id));
                        const st = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["textOverlayRect"])(liveText);
                        // Use rendered bbox for snap geometry, especially for multiline tspans.
                        let bb = null;
                        try {
                            const b = liveText.getBBox?.();
                            if (b && b.width > 0 && b.height > 0) bb = {
                                x: b.x,
                                y: b.y,
                                width: b.width,
                                height: b.height
                            };
                        } catch  {}
                        const txtW = bb?.width ?? st.width;
                        const txtH = bb?.height ?? st.ascent + st.descent;
                        const anchor = st.anchor;
                        // Predict bbox center from drag baseline (first tspan x/y) to keep snap aligned visually.
                        const firstTspanLive = liveText.querySelector("tspan");
                        const firstXCur = parseFloat(firstTspanLive?.getAttribute("x") || liveText.getAttribute("x") || "0");
                        const firstYCur = parseFloat(firstTspanLive?.getAttribute("y") || liveText.getAttribute("y") || "0");
                        const offsetX = bb ? firstXCur - bb.x : 0;
                        const offsetY = bb ? firstYCur - bb.y : txtH / 2;
                        const predictedLeft = rawX - offsetX;
                        const predictedTop = rawY - offsetY;
                        const cx = predictedLeft + txtW / 2;
                        const cy = predictedTop;
                        const { nx, ny, guides, frameX, frameY, frameW, frameH } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applySnap"])(svgEl, cx, cy, txtW, txtH);
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hideGuides"])(svgEl);
                        guides.forEach({
                            "EditorPage.useEffect.onMouseMove": (g)=>{
                                if (g === "left") (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createGuideLine"])(svgEl, "guide-left", frameX, frameY, frameX, frameY + frameH);
                                if (g === "right") (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createGuideLine"])(svgEl, "guide-right", frameX + frameW, frameY, frameX + frameW, frameY + frameH);
                                if (g === "top") (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createGuideLine"])(svgEl, "guide-top", frameX, frameY, frameX + frameW, frameY);
                                if (g === "bottom") (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createGuideLine"])(svgEl, "guide-bottom", frameX, frameY + frameH, frameX + frameW, frameY + frameH);
                                if (g === "cx") (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createGuideLine"])(svgEl, "guide-cx", frameX + frameW / 2, frameY, frameX + frameW / 2, frameY + frameH);
                                if (g === "cy") (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createGuideLine"])(svgEl, "guide-cy", frameX, frameY + frameH / 2, frameX + frameW, frameY + frameH / 2);
                            }
                        }["EditorPage.useEffect.onMouseMove"]);
                        let finalX;
                        if (anchor === "middle") finalX = nx;
                        else if (anchor === "end") finalX = nx + txtW / 2;
                        else finalX = nx - txtW / 2;
                        const finalY = ny + txtH / 2;
                        const docEl = svgDocRef.current?.querySelector(idSelector(drag.id));
                        if (docEl) {
                            // Move tspans by preserving their relative line offsets to avoid mixing lines
                            const tspans = Array.from(docEl.querySelectorAll("tspan"));
                            if (tspans.length) {
                                const firstY = parseFloat(tspans[0].getAttribute("y") || docEl.getAttribute("y") || String(finalY));
                                const firstX = parseFloat(tspans[0].getAttribute("x") || docEl.getAttribute("x") || String(finalX));
                                const dy = finalY - firstY;
                                const dx = finalX - firstX;
                                tspans.forEach({
                                    "EditorPage.useEffect.onMouseMove": (t)=>{
                                        const oldY = parseFloat(t.getAttribute("y") || String(firstY));
                                        const oldX = parseFloat(t.getAttribute("x") || String(firstX));
                                        t.setAttribute("y", String(oldY + dy));
                                        t.setAttribute("x", String(oldX + dx));
                                    }
                                }["EditorPage.useEffect.onMouseMove"]);
                            } else {
                                docEl.setAttribute("x", String(finalX));
                                docEl.setAttribute("y", String(finalY));
                            }
                        }
                        if (liveText) {
                            const tspansLive = Array.from(liveText.querySelectorAll("tspan"));
                            if (tspansLive.length) {
                                const firstY = parseFloat(tspansLive[0].getAttribute("y") || liveText.getAttribute("y") || String(finalY));
                                const firstX = parseFloat(tspansLive[0].getAttribute("x") || liveText.getAttribute("x") || String(finalX));
                                const dy = finalY - firstY;
                                const dx = finalX - firstX;
                                tspansLive.forEach({
                                    "EditorPage.useEffect.onMouseMove": (t)=>{
                                        const oldY = parseFloat(t.getAttribute("y") || String(firstY));
                                        const oldX = parseFloat(t.getAttribute("x") || String(firstX));
                                        t.setAttribute("y", String(oldY + dy));
                                        t.setAttribute("x", String(oldX + dx));
                                    }
                                }["EditorPage.useEffect.onMouseMove"]);
                            } else {
                                liveText.setAttribute("x", String(finalX));
                                liveText.setAttribute("y", String(finalY));
                            }
                            const r = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["textOverlayRect"])(liveText);
                            const ov = svgEl.querySelector("#overlay_" + drag.id);
                            if (ov) {
                                ;
                                ov.setAttribute("x", String(r.rx));
                                ov.setAttribute("y", String(r.ry));
                                ov.setAttribute("width", String(r.rw));
                                ov.setAttribute("height", String(r.rh));
                            }
                        }
                    // Do not bump previewVersion during drag — we already update live DOM above; bumping would re-run the effect and rebuild the whole SVG every frame (jank)
                    }
                }
            }["EditorPage.useEffect.onMouseMove"];
            const onMouseUp = {
                "EditorPage.useEffect.onMouseUp": ()=>{
                    if (!drag) return;
                    const wasDrag = drag.moved;
                    const type = drag.type;
                    const tid = drag.id;
                    drag.overlay.style.cursor = "grab";
                    if (type === "txt") (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hideGuides"])(svgEl);
                    drag = null;
                    if (wasDrag && type === "txt") setPreviewVersion({
                        "EditorPage.useEffect.onMouseUp": (v)=>v + 1
                    }["EditorPage.useEffect.onMouseUp"]);
                    if (!wasDrag && type === "txt") openEditor(tid);
                }
            }["EditorPage.useEffect.onMouseUp"];
            svgEl.addEventListener("mousedown", onMouseDown);
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
            return ({
                "EditorPage.useEffect": ()=>{
                    svgEl.removeEventListener("mousedown", onMouseDown);
                    window.removeEventListener("mousemove", onMouseMove);
                    window.removeEventListener("mouseup", onMouseUp);
                }
            })["EditorPage.useEffect"];
        }
    }["EditorPage.useEffect"], [
        previewVersion,
        textFields,
        zoneStates
    ]);
    const handleExportPDF = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "EditorPage.useCallback[handleExportPDF]": async ()=>{
            const doc = svgDocRef.current;
            if (!doc) return;
            setIsExporting(true);
            try {
                const { jsPDF } = await __turbopack_context__.A("[project]/node_modules/jspdf/dist/jspdf.es.min.js [app-client] (ecmascript, async loader)");
                const s = new XMLSerializer().serializeToString(doc);
                const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(s)));
                const { w, h } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$svg$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSVGSize"])(doc);
                const scale = 2;
                const canvas = document.createElement("canvas");
                canvas.width = w * scale;
                canvas.height = h * scale;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("No canvas context");
                ctx.scale(scale, scale);
                const img = new Image();
                await new Promise({
                    "EditorPage.useCallback[handleExportPDF]": (resolve, reject)=>{
                        img.onload = ({
                            "EditorPage.useCallback[handleExportPDF]": ()=>{
                                ctx.drawImage(img, 0, 0, w, h);
                                resolve();
                            }
                        })["EditorPage.useCallback[handleExportPDF]"];
                        img.onerror = reject;
                        img.src = dataUrl;
                    }
                }["EditorPage.useCallback[handleExportPDF]"]);
                const imgData = canvas.toDataURL("image/png");
                const pxToMm = {
                    "EditorPage.useCallback[handleExportPDF].pxToMm": (px)=>px * 25.4 / 96
                }["EditorPage.useCallback[handleExportPDF].pxToMm"];
                const pw = pxToMm(w);
                const ph = pxToMm(h);
                const pdf = new jsPDF({
                    orientation: pw > ph ? "landscape" : "portrait",
                    unit: "mm",
                    format: [
                        pw,
                        ph
                    ]
                });
                pdf.addImage(imgData, "PNG", 0, 0, pw, ph);
                const filename = (template.name.replace(/[^a-z0-9]/gi, "_") || "export") + ".pdf";
                pdf.save(filename);
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success("PDF exported successfully");
            } catch  {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error("Export failed");
            } finally{
                setIsExporting(false);
            }
        }
    }["EditorPage.useCallback[handleExportPDF]"], [
        template.name
    ]);
    const handleAddToCart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "EditorPage.useCallback[handleAddToCart]": ()=>{
            const doc = svgDocRef.current;
            let customMessage = "";
            if (doc) {
                const s = new XMLSerializer().serializeToString(doc);
                customMessage = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(s)));
            }
            const cartId = resolvedParams.id + "-" + Date.now();
            addToCart({
                id: cartId,
                name: template.name,
                category: template.category,
                price: template.price,
                colors: template.colors,
                emoji: template.emoji,
                customMessage
            });
            router.push("/cart");
        }
    }["EditorPage.useCallback[handleAddToCart]"], [
        template,
        resolvedParams.id,
        addToCart,
        router
    ]);
    if (!template.svg) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex min-h-screen flex-col bg-background",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$navbar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Navbar"], {}, void 0, false, {
                    fileName: "[project]/app/editor/[id]/page.tsx",
                    lineNumber: 937,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                    className: "flex flex-1 items-center justify-center p-8",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-muted-foreground",
                        children: "This template has no SVG. Choose a template with an SVG from the templates page."
                    }, void 0, false, {
                        fileName: "[project]/app/editor/[id]/page.tsx",
                        lineNumber: 939,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/editor/[id]/page.tsx",
                    lineNumber: 938,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/editor/[id]/page.tsx",
            lineNumber: 936,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex min-h-screen flex-col bg-background",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$navbar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Navbar"], {}, void 0, false, {
                fileName: "[project]/app/editor/[id]/page.tsx",
                lineNumber: 947,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: "app",
                className: "flex flex-1 flex-col",
                style: {
                    minHeight: 620
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between border-b border-border px-4 py-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-[15px] font-medium text-foreground",
                                children: "SVG Field Editor"
                            }, void 0, false, {
                                fileName: "[project]/app/editor/[id]/page.tsx",
                                lineNumber: 951,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-muted-foreground",
                                children: template.name
                            }, void 0, false, {
                                fileName: "[project]/app/editor/[id]/page.tsx",
                                lineNumber: 952,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/editor/[id]/page.tsx",
                        lineNumber: 950,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex min-h-[570px] flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex w-[290px] min-w-[250px] flex-col border-r border-border",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 overflow-y-auto px-3 pb-4 pt-2",
                                        children: !svgLoaded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "py-6 text-center text-sm text-muted-foreground",
                                            children: "Loading…"
                                        }, void 0, false, {
                                            fileName: "[project]/app/editor/[id]/page.tsx",
                                            lineNumber: 961,
                                            columnNumber: 17
                                        }, this) : textFields.length === 0 && imageZones.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "py-6 text-center text-sm leading-relaxed text-muted-foreground",
                                            children: [
                                                "No editable fields found.",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                    fileName: "[project]/app/editor/[id]/page.tsx",
                                                    lineNumber: 965,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs",
                                                    children: 'Use id="editable_*" or id="image_zone_*"'
                                                }, void 0, false, {
                                                    fileName: "[project]/app/editor/[id]/page.tsx",
                                                    lineNumber: 966,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/editor/[id]/page.tsx",
                                            lineNumber: 963,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                textFields.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "mb-1 mt-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
                                                            children: "Text fields"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/editor/[id]/page.tsx",
                                                            lineNumber: 972,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "mb-2 text-[11px] text-muted-foreground",
                                                            children: "Click to edit inline • Drag to move • Snaps to center & edges"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/editor/[id]/page.tsx",
                                                            lineNumber: 973,
                                                            columnNumber: 23
                                                        }, this),
                                                        textFields.map(({ id, label })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mb-2.5",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "mb-1 flex items-center gap-1.5 text-xs capitalize text-muted-foreground",
                                                                        children: [
                                                                            label,
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                                                                                children: "text"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                lineNumber: 978,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                                                        lineNumber: 976,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    (textValues[id] || "").includes("\n") || (textValues[id] || "").length > 60 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                        ref: (el)=>{
                                                                            if (el) panelInputRefs.current[id] = el;
                                                                        },
                                                                        className: "min-h-[52px] w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground",
                                                                        value: textValues[id] ?? "",
                                                                        onChange: (e)=>{
                                                                            const v = e.target.value;
                                                                            const docEl = svgDocRef.current?.querySelector(idSelector(id));
                                                                            if (docEl) docEl.textContent = v;
                                                                            setTextValues((prev)=>({
                                                                                    ...prev,
                                                                                    [id]: v
                                                                                }));
                                                                            setPreviewVersion((x)=>x + 1);
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                                                        lineNumber: 981,
                                                                        columnNumber: 29
                                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                        ref: (el)=>{
                                                                            if (el) panelInputRefs.current[id] = el;
                                                                        },
                                                                        className: "rounded-md border-border px-2.5 py-1.5 text-[13px]",
                                                                        value: textValues[id] ?? "",
                                                                        onChange: (e)=>{
                                                                            const v = e.target.value;
                                                                            const docEl = svgDocRef.current?.querySelector(idSelector(id));
                                                                            if (docEl) docEl.textContent = v;
                                                                            setTextValues((prev)=>({
                                                                                    ...prev,
                                                                                    [id]: v
                                                                                }));
                                                                            setPreviewVersion((x)=>x + 1);
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                                                        lineNumber: 996,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    id === "editable_title" && (()=>{
                                                                        const v = textValues[id] || "";
                                                                        fetch("http://127.0.0.1:7918/ingest/0625c21e-ccbe-468d-acee-2a41c806255c", {
                                                                            method: "POST",
                                                                            headers: {
                                                                                "Content-Type": "application/json",
                                                                                "X-Debug-Session-Id": "d7e809"
                                                                            },
                                                                            body: JSON.stringify({
                                                                                sessionId: "d7e809",
                                                                                runId: "pre-fix-merge-lines",
                                                                                hypothesisId: "H4",
                                                                                location: "app/editor/[id]/page.tsx:left-panel-input-switch",
                                                                                message: "left panel control type decision",
                                                                                data: {
                                                                                    id,
                                                                                    hasNewline: v.includes("\n"),
                                                                                    length: v.length,
                                                                                    chosen: v.includes("\n") || v.length > 60 ? "textarea" : "input",
                                                                                    value: v
                                                                                },
                                                                                timestamp: Date.now()
                                                                            })
                                                                        }).catch(()=>{});
                                                                        return null;
                                                                    })()
                                                                ]
                                                            }, id, true, {
                                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                                lineNumber: 975,
                                                                columnNumber: 25
                                                            }, this))
                                                    ]
                                                }, void 0, true),
                                                imageZones.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "mb-1 mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
                                                            children: "Image zones"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/editor/[id]/page.tsx",
                                                            lineNumber: 1043,
                                                            columnNumber: 23
                                                        }, this),
                                                        imageZones.map((zone)=>{
                                                            const st = zoneStates[zone.id];
                                                            const hasImage = !!st.b64;
                                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mb-2.5",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "mb-1 flex items-center gap-1.5 text-xs capitalize text-muted-foreground",
                                                                        children: [
                                                                            zone.label,
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300",
                                                                                children: "image"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                lineNumber: 1051,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                                                        lineNumber: 1049,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                        ref: (el)=>{
                                                                            if (el) fileInputRefs.current[zone.id] = el;
                                                                        },
                                                                        type: "file",
                                                                        accept: "image/*",
                                                                        className: "hidden",
                                                                        onChange: async (e)=>{
                                                                            const file = e.target.files?.[0];
                                                                            if (!file) return;
                                                                            setZoneBusy((prev)=>({
                                                                                    ...prev,
                                                                                    [zone.id]: true
                                                                                }));
                                                                            try {
                                                                                let b64 = "";
                                                                                let iw = 0;
                                                                                let ih = 0;
                                                                                if (file.size >= IMAGE_COMPRESS_SKIP_BELOW_BYTES) {
                                                                                    const c = await compressImageFileToJpegDataUrl(file);
                                                                                    b64 = c.dataUrl;
                                                                                    iw = c.w;
                                                                                    ih = c.h;
                                                                                } else {
                                                                                    b64 = await fileToDataUrl(file);
                                                                                    const img = new Image();
                                                                                    await new Promise((resolve, reject)=>{
                                                                                        img.onload = ()=>resolve();
                                                                                        img.onerror = ()=>reject(new Error("Image load failed"));
                                                                                        img.src = b64;
                                                                                    });
                                                                                    iw = img.naturalWidth;
                                                                                    ih = img.naturalHeight;
                                                                                }
                                                                                setZoneStates((prev)=>({
                                                                                        ...prev,
                                                                                        [zone.id]: {
                                                                                            ...prev[zone.id],
                                                                                            b64,
                                                                                            imgW: iw,
                                                                                            imgH: ih,
                                                                                            scale: 1,
                                                                                            offsetX: 0,
                                                                                            offsetY: 0
                                                                                        }
                                                                                    }));
                                                                                setPreviewVersion((v)=>v + 1);
                                                                            } catch  {
                                                                                // Fallback: try original data URL path
                                                                                try {
                                                                                    const b64 = await fileToDataUrl(file);
                                                                                    const img = new Image();
                                                                                    await new Promise((resolve, reject)=>{
                                                                                        img.onload = ()=>resolve();
                                                                                        img.onerror = ()=>reject(new Error("Image load failed"));
                                                                                        img.src = b64;
                                                                                    });
                                                                                    setZoneStates((prev)=>({
                                                                                            ...prev,
                                                                                            [zone.id]: {
                                                                                                ...prev[zone.id],
                                                                                                b64,
                                                                                                imgW: img.naturalWidth,
                                                                                                imgH: img.naturalHeight,
                                                                                                scale: 1,
                                                                                                offsetX: 0,
                                                                                                offsetY: 0
                                                                                            }
                                                                                        }));
                                                                                    setPreviewVersion((v)=>v + 1);
                                                                                } catch  {
                                                                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error("Image upload failed");
                                                                                }
                                                                            } finally{
                                                                                setZoneBusy((prev)=>({
                                                                                        ...prev,
                                                                                        [zone.id]: false
                                                                                    }));
                                                                            }
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                                                        lineNumber: 1053,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        className: "flex w-full items-center gap-2 rounded-md border border-dashed border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60",
                                                                        disabled: !!zoneBusy[zone.id],
                                                                        onClick: ()=>fileInputRefs.current[zone.id]?.click(),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-sm",
                                                                                children: "+"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                lineNumber: 1136,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                children: zoneBusy[zone.id] ? "Compressing…" : hasImage ? fileInputRefs.current[zone.id]?.files?.[0]?.name?.slice(0, 20) || "Image" : "Choose image"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                lineNumber: 1137,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                                                        lineNumber: 1130,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    hasImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                type: "button",
                                                                                className: "mt-1 w-full rounded-md border border-border py-1 px-2.5 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
                                                                                onClick: ()=>{
                                                                                    setZoneStates((prev)=>({
                                                                                            ...prev,
                                                                                            [zone.id]: {
                                                                                                ...prev[zone.id],
                                                                                                b64: "",
                                                                                                imgW: 0,
                                                                                                imgH: 0,
                                                                                                scale: 1,
                                                                                                offsetX: 0,
                                                                                                offsetY: 0
                                                                                            }
                                                                                        }));
                                                                                    const el = svgDocRef.current?.querySelector(idSelector(zone.id));
                                                                                    if (el) {
                                                                                        el.removeAttribute("href");
                                                                                        el.removeAttribute("xlink:href");
                                                                                        el.setAttribute("x", String(zone.zoneX));
                                                                                        el.setAttribute("y", String(zone.zoneY));
                                                                                        el.setAttribute("width", String(zone.zoneW));
                                                                                        el.setAttribute("height", String(zone.zoneH));
                                                                                    }
                                                                                    setPreviewVersion((v)=>v + 1);
                                                                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success("Image removed");
                                                                                },
                                                                                children: "Remove image"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                lineNumber: 1147,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "mt-1 flex items-center gap-2",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                        className: "w-7 shrink-0 text-[11px] text-muted-foreground",
                                                                                        children: "Zoom"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                        lineNumber: 1179,
                                                                                        columnNumber: 35
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "range",
                                                                                        min: "50",
                                                                                        max: "300",
                                                                                        value: Math.round((st.scale || 1) * 100),
                                                                                        onChange: (e)=>{
                                                                                            const scale = Number(e.target.value) / 100;
                                                                                            setZoneStates((prev)=>({
                                                                                                    ...prev,
                                                                                                    [zone.id]: {
                                                                                                        ...prev[zone.id],
                                                                                                        scale
                                                                                                    }
                                                                                                }));
                                                                                            setPreviewVersion((v)=>v + 1);
                                                                                        },
                                                                                        className: "h-0.5 flex-1"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                        lineNumber: 1180,
                                                                                        columnNumber: 35
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                        className: "min-w-8 text-right text-[11px] text-foreground",
                                                                                        children: [
                                                                                            Math.round((st.scale || 1) * 100),
                                                                                            "%"
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                        lineNumber: 1195,
                                                                                        columnNumber: 35
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                lineNumber: 1178,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: "mt-1 text-[11px] text-muted-foreground",
                                                                                children: "Drag image in preview to reposition"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                                                lineNumber: 1197,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true)
                                                                ]
                                                            }, zone.id, true, {
                                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                                lineNumber: 1048,
                                                                columnNumber: 27
                                                            }, this);
                                                        })
                                                    ]
                                                }, void 0, true)
                                            ]
                                        }, void 0, true)
                                    }, void 0, false, {
                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                        lineNumber: 959,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "border-t border-border p-3",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            className: "w-full bg-primary text-primary-foreground hover:bg-primary/90",
                                            onClick: handleAddToCart,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"], {
                                                    className: "mr-2 h-4 w-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/editor/[id]/page.tsx",
                                                    lineNumber: 1215,
                                                    columnNumber: 17
                                                }, this),
                                                "Add to Cart – ₹",
                                                template.price
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/editor/[id]/page.tsx",
                                            lineNumber: 1211,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                        lineNumber: 1210,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/editor/[id]/page.tsx",
                                lineNumber: 958,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-1 flex-col overflow-hidden",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between border-b border-border px-3 py-2.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
                                                children: "Live Preview"
                                            }, void 0, false, {
                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                lineNumber: 1224,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "outline",
                                                size: "sm",
                                                className: "text-xs",
                                                disabled: isExporting || !svgLoaded,
                                                onClick: handleExportPDF,
                                                children: isExporting ? "Exporting…" : "Export PDF"
                                            }, void 0, false, {
                                                fileName: "[project]/app/editor/[id]/page.tsx",
                                                lineNumber: 1225,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                        lineNumber: 1223,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        ref: previewContainerRef,
                                        className: "flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-5",
                                        children: !svgLoaded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col items-center gap-2 text-[13px] text-muted-foreground",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[32px] opacity-20",
                                                    children: "◇"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/editor/[id]/page.tsx",
                                                    lineNumber: 1241,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Preview appears here"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/editor/[id]/page.tsx",
                                                    lineNumber: 1242,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/editor/[id]/page.tsx",
                                            lineNumber: 1240,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/editor/[id]/page.tsx",
                                        lineNumber: 1235,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/editor/[id]/page.tsx",
                                lineNumber: 1222,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/editor/[id]/page.tsx",
                        lineNumber: 956,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/editor/[id]/page.tsx",
                lineNumber: 948,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/editor/[id]/page.tsx",
        lineNumber: 946,
        columnNumber: 5
    }, this);
}
_s(EditorPage, "wEm/WPEtNop9lZY43p1Jcaf8iq0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$cart$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCart"]
    ];
});
_c = EditorPage;
var _c;
__turbopack_context__.k.register(_c, "EditorPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_2ef48338._.js.map