from .nodes import ReiImageStitch

NODE_CLASS_MAPPINGS = {
    "ReiImageStitch": ReiImageStitch,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ReiImageStitch": "Rei-ImageStitch",
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
