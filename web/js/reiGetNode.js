const { app } = window.comfyAPI.app;

// ReiGetNode - Modified Get node with output on the left side and GET-VARIABLE naming
// Based on KJNodes SetGet by diffus3

function setColorAndBgColor(type) {
    const colorMap = {
        "DEFAULT": LGraphCanvas.node_colors.gray,
        "MODEL": LGraphCanvas.node_colors.blue,
        "LATENT": LGraphCanvas.node_colors.purple,
        "VAE": LGraphCanvas.node_colors.red,
        "WANVAE": LGraphCanvas.node_colors.red,
        "CONDITIONING": LGraphCanvas.node_colors.brown,
        "IMAGE": LGraphCanvas.node_colors.pale_blue,
        "CLIP": LGraphCanvas.node_colors.yellow,
        "FLOAT": LGraphCanvas.node_colors.green,
        "MASK": { color: "#1c5715", bgcolor: "#1f401b"},
        "INT": { color: "#1b4669", bgcolor: "#29699c"},
        "CONTROL_NET": { color: "#156653", bgcolor: "#1c453b"},
        "NOISE": { color: "#2e2e2e", bgcolor: "#242121"},
        "GUIDER": { color: "#3c7878", bgcolor: "#1c453b"},
        "SAMPLER": { color: "#614a4a", bgcolor: "#3b2c2c"},
        "SIGMAS": { color: "#485248", bgcolor: "#272e27"},
    };
    const colors = colorMap[type];
    if (colors) {
        this.color = colors.color;
        this.bgcolor = colors.bgcolor;
    } else {
        this.color = LGraphCanvas.node_colors.gray;
        this.bgcolor = LGraphCanvas.node_colors.gray;
    }
}

const LGraphNode = LiteGraph.LGraphNode;

function showAlert(message) {
    app.extensionManager.toast.add({
        severity: 'warn',
        summary: "Reiya ReiGetNode",
        detail: `${message}. Most likely you're missing custom nodes`,
        life: 5000,
    });
}

app.registerExtension({
    name: "ReiGetNode",
    registerCustomNodes() {
        class ReiGetNode extends LGraphNode {
            defaultVisibility = true;
            serialize_widgets = true;
            drawConnection = false;
            slotColor = "#FFF";
            currentSetter = null;
            canvas = app.canvas;

            constructor(title) {
                super(title);
                if (!this.properties) {
                    this.properties = {};
                }
                this.properties.showOutputText = ReiGetNode.defaultVisibility;
                const node = this;

                this.addWidget(
                    "combo",
                    "Constant",
                    "",
                    (e) => {
                        this.onRename();
                    },
                    {
                        values: () => {
                            const setterNodes = node.graph._nodes.filter((otherNode) => otherNode.type == 'SetNode');
                            return setterNodes.map((otherNode) => otherNode.widgets[0].value).sort();
                        }
                    }
                );

                // Add output with LEFT direction for left-side placement
                this.addOutput("*", '*');
                this.outputs[0].dir = LiteGraph.LEFT;

                this.onConnectionsChange = function(
                    slotType,
                    slot,
                    isChangeConnect,
                    link_info,
                    output
                ) {
                    this.validateLinks();
                };

                this.setName = function(name) {
                    node.widgets[0].value = name;
                    node.onRename();
                    node.serialize();
                };

                this.onRename = function() {
                    const setter = this.findSetter(node.graph);
                    if (setter) {
                        let linkType = setter.inputs[0].type;
                        this.setType(linkType);
                        // Use GET- prefix with dash instead of underscore
                        this.title = "GET-" + setter.widgets[0].value;

                        if (app.ui.settings.getSettingValue("KJNodes.nodeAutoColor")) {
                            setColorAndBgColor.call(this, linkType);
                        }
                    } else {
                        this.setType('*');
                    }
                };

                this.clone = function() {
                    const cloned = ReiGetNode.prototype.clone.apply(this);
                    cloned.size = cloned.computeSize();
                    return cloned;
                };

                this.validateLinks = function() {
                    if (this.outputs[0].type !== '*' && this.outputs[0].links) {
                        this.outputs[0].links.filter(linkId => {
                            const link = node.graph.links[linkId];
                            return link && (!link.type.split(",").includes(this.outputs[0].type) && link.type !== '*');
                        }).forEach(linkId => {
                            node.graph.removeLink(linkId);
                        });
                    }
                };

                this.setType = function(type) {
                    this.outputs[0].name = type;
                    this.outputs[0].type = type;
                    this.validateLinks();
                };

                this.findSetter = function(graph) {
                    const name = this.widgets[0].value;
                    const foundNode = graph._nodes.find(otherNode => otherNode.type === 'SetNode' && otherNode.widgets[0].value === name && name !== '');
                    return foundNode;
                };

                this.goToSetter = function() {
                    this.canvas.centerOnNode(this.currentSetter);
                    this.canvas.selectNode(this.currentSetter, false);
                };

                // Virtual node - does not impact the resulting prompt
                this.isVirtualNode = true;
            }

            getInputLink(slot) {
                const setter = this.findSetter(this.graph);
                if (setter) {
                    const slotInfo = setter.inputs[slot];
                    const link = this.graph.links[slotInfo.link];
                    return link;
                } else {
                    const errorMessage = "No SetNode found for " + this.widgets[0].value + " (" + this.type + ")";
                    showAlert(errorMessage);
                }
            }

            onAdded(graph) {
            }

            getExtraMenuOptions(_, options) {
                let menuEntry = this.drawConnection ? "Hide connections" : "Show connections";
                this.currentSetter = this.findSetter(this.graph);
                if (!this.currentSetter) return;
                options.unshift(
                    {
                        content: "Go to setter",
                        callback: () => {
                            this.goToSetter();
                        },
                    },
                    {
                        content: menuEntry,
                        callback: () => {
                            let linkType = this.currentSetter.inputs[0].type;
                            this.drawConnection = !this.drawConnection;
                            this.slotColor = this.canvas.default_connection_color_byType[linkType];
                            this.canvas.setDirty(true, true);
                        },
                    },
                );
            }

            onDrawForeground(ctx, lGraphCanvas) {
                if (this.drawConnection) {
                    this._drawVirtualLink(lGraphCanvas, ctx);
                }
            }

            _drawVirtualLink(lGraphCanvas, ctx) {
                if (!this.currentSetter) return;

                const defaultLink = { type: 'default', color: this.slotColor };

                let start_node_slotpos = this.currentSetter.getConnectionPos(false, 0);
                start_node_slotpos = [
                    start_node_slotpos[0] - this.pos[0],
                    start_node_slotpos[1] - this.pos[1],
                ];
                // Adjusted for left-side output
                let end_node_slotpos = [0, LiteGraph.NODE_TITLE_HEIGHT * 0.5];
                lGraphCanvas.renderLink(
                    ctx,
                    start_node_slotpos,
                    end_node_slotpos,
                    defaultLink,
                    false,
                    null,
                    this.slotColor
                );
            }
        }

        LiteGraph.registerNodeType(
            "ReiGetNode",
            Object.assign(ReiGetNode, {
                title: "Rei-GetNode",
            })
        );

        ReiGetNode.category = "ReiyaNodes";
    },
});
