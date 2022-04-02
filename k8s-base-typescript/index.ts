import * as k8s from "@pulumi/kubernetes";
import * as  pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const nextcloudAdminPw = config.requireSecret("nextcloudAdminPw");

const nextcloud = new k8s.helm.v3.Chart("nextcloud", {
    chart: "nextcloud",
    version: "2.13.2",
    fetchOpts: {
        repo: "https://nextcloud.github.io/helm/",
    },
    values: {
        image: {
            tag: "23.0.3",
        },
        ingress: {
            enabled: true,
            annotations: {
                "traefik.ingress.kubernetes.io/router.entrypoints": "websecure",
                "traefik.ingress.kubernetes.io/router.middlewares": "default-nextcloud-redirect-regex@kubernetescrd, default-nextcloud-cors-header@kubernetescrd",
                "traefik.ingress.kubernetes.io/router.tls.certresolver": "traefikresolver",
            }
        },
        nextcloud: {
            host: "nextcloud.alex-stadler.com",
            password: nextcloudAdminPw,
            configs: {
                "reverse.config.php":
                    "<?php\n" +
                    "$CONFIG = array (\n" +
                    "  'trusted_proxies'   => ['traefik'],\n" +
                    "  'overwriteprotocol' => 'https',\n" +
                    ");\n"
            }
        },
        // add password generation
        mariadb: {
            enabled: true
        },
        redis: {
            enabled: true
        },
        cronjob: {
            enabled: true
        },
        persistence: {
            enabled: true,
            size: "32Gi"
        }
    },
});
