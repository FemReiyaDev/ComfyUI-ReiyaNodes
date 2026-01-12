const { app } = window.comfyAPI.app;

app.registerExtension({
    name: "ReiyaNodes.RMImageStitch",

    async nodeCreated(node) {
        if (node.comfyClass !== "RMImageStitch") return;

        const numImagesWidget = node.widgets?.find(w => w.name === "num_images");
        if (!numImagesWidget) return;

        // Function to dynamically add/remove inputs based on num_images
        const updateInputs = () => {
            const targetCount = numImagesWidget.value;

            // Count current image inputs
            const getImageInputCount = () => {
                let count = 0;
                for (const input of node.inputs) {
                    if (input.name.startsWith("image_")) {
                        count++;
                    }
                }
                return count;
            };

            let currentCount = getImageInputCount();

            // Remove excess inputs (from highest to lowest)
            if (currentCount > targetCount) {
                for (let i = currentCount; i > targetCount; i--) {
                    const inputIndex = node.inputs.findIndex(inp => inp.name === `image_${i}`);
                    if (inputIndex !== -1) {
                        // Disconnect if connected
                        if (node.inputs[inputIndex].link != null) {
                            node.disconnectInput(inputIndex);
                        }
                        node.removeInput(inputIndex);
                    }
                }
            }
            // Add missing inputs
            else if (currentCount < targetCount) {
                for (let i = currentCount + 1; i <= targetCount; i++) {
                    node.addInput(`image_${i}`, "IMAGE");
                }
            }

            // Resize node to fit inputs (preserve width, update height)
            const currentWidth = node.size[0];
            const newSize = node.computeSize();
            node.setSize([currentWidth, newSize[1]]);
            app.graph.setDirtyCanvas(true, true);
        };

        // Store original callback
        const originalCallback = numImagesWidget.callback;

        // Override callback to update inputs when value changes
        numImagesWidget.callback = function(value) {
            if (originalCallback) {
                originalCallback.call(this, value);
            }
            updateInputs();
        };

        // Initial update
        setTimeout(() => {
            updateInputs();
        }, 100);
    },

    async loadedGraphNode(node) {
        if (node.comfyClass !== "RMImageStitch") return;

        const numImagesWidget = node.widgets?.find(w => w.name === "num_images");
        if (!numImagesWidget) return;

        // Update inputs when loading a saved graph
        setTimeout(() => {
            const targetCount = numImagesWidget.value;

            // Count current image inputs
            let currentCount = 0;
            for (const input of node.inputs) {
                if (input.name.startsWith("image_")) {
                    currentCount++;
                }
            }

            // Remove excess inputs (from highest to lowest)
            if (currentCount > targetCount) {
                for (let i = currentCount; i > targetCount; i--) {
                    const inputIndex = node.inputs.findIndex(inp => inp.name === `image_${i}`);
                    if (inputIndex !== -1) {
                        if (node.inputs[inputIndex].link != null) {
                            node.disconnectInput(inputIndex);
                        }
                        node.removeInput(inputIndex);
                    }
                }
            }
            // Add missing inputs
            else if (currentCount < targetCount) {
                for (let i = currentCount + 1; i <= targetCount; i++) {
                    node.addInput(`image_${i}`, "IMAGE");
                }
            }

            // Resize node to fit inputs (preserve width, update height)
            const currentWidth = node.size[0];
            const newSize = node.computeSize();
            node.setSize([currentWidth, newSize[1]]);
            app.graph.setDirtyCanvas(true, true);
        }, 100);
    }
});
